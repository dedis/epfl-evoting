const async = require("async");
const _ = require("lodash");
const cothority = require("@dedis/cothority");
const net = cothority.net;
const debug = require("debug")("artillery-engine-cothority");
const fs = require("fs");
const traverse = require("traverse");

class CothorityPlugin {
  constructor(script, ee, helpers) {
    this.config = script.config;
    this.helpers = helpers;
  }

  createScenario(scenarioSpec, ee) {
    this._ensurePropertyIsAList(scenarioSpec, "beforeRequest");
    this._ensurePropertyIsAList(scenarioSpec, "afterResponse");
    this._ensurePropertyIsAList(scenarioSpec, "beforeScenario");
    this._ensurePropertyIsAList(scenarioSpec, "afterScenario");

    const beforeScenarioFns = _.map(scenarioSpec.beforeScenario, function(
      hookFunctionName
    ) {
      return { function: hookFunctionName };
    });
    const afterScenarioFns = _.map(scenarioSpec.afterScenario, function(
      hookFunctionName
    ) {
      return { function: hookFunctionName };
    });

    const newFlow = beforeScenarioFns.concat(
      scenarioSpec.flow.concat(afterScenarioFns)
    );

    scenarioSpec.flow = newFlow;

    let tasks = scenarioSpec.flow.map(rs => {
      return this.step(rs, ee, {
        beforeRequest: scenarioSpec.beforeRequest,
        afterResponse: scenarioSpec.afterResponse
      });
    });
    return this.compile(tasks, scenarioSpec.flow, ee);
  }

  _ensurePropertyIsAList(obj, prop) {
    obj[prop] = [].concat(typeof obj[prop] === "undefined" ? [] : obj[prop]);
    return obj;
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

  _template(o, context) {
    let result;
    const that = this;
    if (typeof o === "object") {
      result = traverse(o).map(function(x) {
        if (typeof x === "string") {
          this.update(that._template(x, context));
        } else {
          return x;
        }
      });
    } else {
      if (!/{{/.test(o)) {
        return context.vars[o] || o;
      }
      const funcCallRegex = /{{\s*(\$[A-Za-z0-9_]+\s*\(\s*.*\s*\))\s*}}/;
      let match = o.match(funcCallRegex);
      if (match) {
        // This looks like it could be a function call:
        const syntax = esprima.parse(match[1]);
        // TODO: Use a proper schema for what we expect here
        if (
          syntax.body &&
          syntax.body.length === 1 &&
          syntax.body[0].type === "ExpressionStatement"
        ) {
          let funcName = syntax.body[0].expression.callee.name;
          let args = L.map(syntax.body[0].expression.arguments, function(arg) {
            return arg.value;
          });
          if (funcName in context.funcs) {
            return that._template(
              o.replace(
                funcCallRegex,
                context.funcs[funcName].apply(null, args)
              ),
              context
            );
          } else if (funcName in this.config.processor) {
            return this.config.processor.apply(null, _.concat(context, args));
          }
        }
      } else {
        if (!o.match(/{{/)) {
          if (o.match(/\s*/)) {
          }
          return context.vars[o] || o;
        }

        result = renderVariables(o, context.vars);
      }
    }
    return result;
  }

  step(rs, ee, opts) {
    opts = opts || {};
    const { config } = this;
    if (rs.log) {
      return (context, callback) => {
        console.log(this._template(rs.log, context));
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

    if (rs.function) {
      return (context, callback) => {
        let processFunc = this.config.processor[rs.function];
        if (processFunc) {
          return processFunc(this.config, context, ee, function() {
            return callback(null, context);
          });
        } else {
          return process.nextTick(function() {
            callback(null, context);
          });
        }
      };
    }

    if (rs.send) {
      return (context, callback) => {
        let { data, request, response, beforeRequest, afterResponse } = rs.send;
        const that = this;

        let functionNames = _.concat(
          opts.beforeRequest || [],
          beforeRequest || []
        );
        async.eachSeries(
          functionNames,
          (functionName, next) => {
            let processFunc = config.processor[functionName];
            processFunc(context, ee, err => {
              if (err) {
                return next(err);
              }
              return next(null);
            });
          },
          err => {
            if (err) {
              console.log(err);
              ee.emit("error", err);
              return callback(err, context);
            }
            data = that._template(data, context);
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
                    return callback(err, context);
                  }
                  debug("captures: %o", captures);

                  _.each(captures, (v, k) => {
                    context.vars[k] = v;
                  });
                  const afterResponseFns = _.concat(
                    opts.afterResponse || [],
                    afterResponse || []
                  );
                  async.eachSeries(
                    afterResponseFns,
                    (fnName, next) => {
                      let procFn = config.processor[fnName];
                      procFn(reply, context, ee, err => {
                        if (err) {
                          return next(err);
                        }
                        return next(null);
                      });
                    },
                    err => {
                      if (err) {
                        console.error(err);
                        ee.emit("error", err);
                        return callback(err, context);
                      }
                      return callback(null, context);
                    }
                  );
                });
              })
              .catch(err => {
                debug(err);
                ee.emit("error", err);
                return callback(err, context);
              });
          }
        );
      };
    }
  }

  compile(tasks, scenarioSpec, ee) {
    return (initialContext, callback) => {
      const init = next => {
        const {
          rosterToml,
          service,
          maxCount,
          voterCount
        } = this.config.cothority;
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
          initialContext.maxCount = maxCount || 1;
          initialContext.voterCount = voterCount || 7;
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
