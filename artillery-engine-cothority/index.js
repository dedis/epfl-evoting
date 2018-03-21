const async = require("async");
const _ = require("lodash");
const cothority = require("@dedis/cothority");
const net = cothority.net;
const debug = require("debug")("artillery-engine-cothority");
const fs = require("fs");

class CothorityPlugin {
  constructor(script, ee, helpers) {
    this.config = script.config;
    this.helpers = helpers;
  }

  createScenario(scenarioSpec, ee) {
    let tasks = scenarioSpec.flow.map(rs => this.step(rs, ee));
    console.dir(scenarioSpec.flow);
    return this.compile(tasks, scenarioSpec.flow, ee);
  }
  _capture(params, response, context, done) {
    let captures = {};

    if (!params.capture) {
      return done(null, captures);
    }

    let specs = _.get(params, "capture", []);
    let self = this;

    async.eachSeries(
      specs,
      (spec, next) => {
        captures[spec] = response[spec];
        return next(null);
      },
      err => {
        if (err) {
          return done(err, null);
        }
        return done(null, captures);
      }
    );
  }
  step(rs, ee) {
    if (rs.log) {
      return (context, callback) => {
        console.log(this.helpers.template(rs.log, context));
        return process.nextTick(() => {
          callback(null, context);
        });
      };
    }

    if (rs.loop) {
      const steps = rs.loop.map(loopStep => this.step(loopStep, ee));

      return this.helpers.createLoopWithCount(rs.count || -1, steps);
    }

    if (rs.think) {
      return this.helpers.createThink(
        rs,
        _.get(this.config, "defaults.think", {})
      );
    }

    if (rs.send) {
      return (context, callback) => {
        let { data, request, response } = rs.send;
        data = this.helpers.template(data, context);
        ee.emit("request");
        const startedAt = process.hrtime();

        debug(
          `rosterSocket send: rosterSocket.send(${request}, ${response}, %o)`,
          data
        );

        context.ws
          .send(request, response, data)
          .then(reply => {
            const endedAt = process.hrtime(startedAt);
            const delta = endedAt[0] * 1e9 + endedAt[1];
            ee.emit("response", delta, 0, context._uid);
            this._capture(rs.send, reply, context, (err, captures) => {
              if (err) {
                // TODO: run onError hooks
                ee.emit("error", err);
                callback(err, context);
              }
              debug("captures: %o", captures);

              _.each(captures, (v, k) => {
                context.vars[k] = v;
              });
              context._successCount++;
              return callback(null, context);
            });
          })
          .catch(err => {
            debug(err);
            ee.emit("error", err);
            callback(err, context);
          });
      };
    }
  }

  compile(tasks, scenarioSpec, ee) {
    return (initialContext, callback) => {
      const init = next => {
        const { rosterToml, service } = this.config.cothority;
        if (!rosterToml) {
          const err = new Error("Please specify a roster");
          ee.emit("error", err);
          return next(err, initialContext);
        }

        if (!service) {
          const err = new Error("Please mention a service");
          ee.emit("error", err);
          return next(err, initialContext);
        }

        fs.readFile(rosterToml, "utf8", (err, roster) => {
          initialContext.ws = new net.RosterSocket(
            cothority.Roster.fromTOML(roster),
            service
          );
          ee.emit("started");
          return next(null, initialContext);
        });
      };

      const steps = [init].concat(tasks);

      async.waterfall(steps, (err, context) => {
        if (err) {
          debug(err);
        }
        return callback(err, context);
      });
    };
  }
}

module.exports = CothorityPlugin;
