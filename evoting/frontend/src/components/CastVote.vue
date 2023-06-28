<template>
  <v-layout class="content" row wrap>
    <v-flex xs12 sm12 offset-md3 md6>
      <v-card>
        <v-toolbar card dark :class="election.theme">
          <v-toolbar-title class="white--text">{{
            $t(`election_${getId(election)}.name`)
          }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <div v-if="mi(election)">
            <a class="election-info" target="_blank" :href="mi(election)"
              ><v-icon>mdi-information</v-icon></a
            >
          </div>
          <div v-if="voted">
            <v-tooltip bottom>
              <v-icon class="election-voted" dark color="white" slot="activator"
                >mdi-check</v-icon
              >
              <span>{{ $t("message.ballotCast", { block: voted }) }} </span>
            </v-tooltip>
          </div>
        </v-toolbar>
        <v-card-title>
          <v-container fluid>
            <div v-if="voted">
              <v-layout>
                <v-flex xs12>
                  <v-card light color="yellow lighten-5">
                    {{ $t("message.voteAgain") }}
                  </v-card>
                  <br />
                </v-flex>
              </v-layout>
            </div>
            <v-layout>
              <v-flex xs12>
                {{ $t(`election_${getId(election)}.subtitle`) }}
              </v-flex>
            </v-layout>
            <br />
            <v-form v-model="valid" v-on:submit="submitHandler">
              <v-layout row wrap>
                <v-flex xs12>
                  <p>
                    {{
                      $t("message.electionInstruction", {
                        maxChoices: election.maxchoices,
                      })
                    }}
                  </p>
                  <v-radio-group>
                    <v-checkbox
                      v-for="candidate in candidates"
                      :key="candidate"
                      :value="`${candidate}`"
                      v-model="ballot"
                      :rules="[validateBallot]"
                    >
                      <template slot="label">
                        <a
                          @click.stop
                          target="_blank"
                          :href="`https://people.epfl.ch/${candidate}`"
                          >{{ candidateNames[candidate] }}</a
                        >
                      </template>
                    </v-checkbox>
                  </v-radio-group>
                </v-flex>
                <v-flex xs12 class="text-xs-center">
                  <v-btn
                    type="submit"
                    :disabled="!(valid && ballot.length !== 0) || submitted"
                    color="primary"
                    >{{ $t("message.vote") }}</v-btn
                  >
                </v-flex>
              </v-layout>
            </v-form>
          </v-container>
        </v-card-title>
      </v-card>
    </v-flex>
    <v-dialog v-model="dialog3" persistent max-width="500px">
      <v-card>
        <v-card-title>
          <span> {{ $t("message.cast") }} </span>
        </v-card-title>
        <v-card-actions>
          <v-btn
            color="primary"
            flat
            @click.stop="
              dialog3 = false;
              $router.push('/');
            "
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import kyber from "@dedis/kyber";
import { Uint8ArrayToHex, timestampToString, getSig } from "../utils";
import version from "@/version";
import rosterTOML from "raw-loader!../public.toml";
import config from "@/config";
import {
  Ballot,
  Cast,
  CastReply,
  LookupSciper,
  LookupSciperReply,
} from "@/proto";
import { randomBytes } from "crypto-browserify";
import { Roster } from "@dedis/cothority/network";
import { SkipchainRPC } from "@dedis/cothority/skipchain";

const curve = new kyber.curve.edwards25519.Curve();

export const encodeScipers = (scipers, maxchoices) => {
  const bufferv = [];
  for (let i=0; i < maxchoices; i += 9) {
    const start = Math.min(scipers.length, i);
    const end = Math.min(scipers.length, i+9);
    const buf = Buffer.alloc(3 * (end - start) + 1);
    if (end > start){
      scipers.slice(i,end).forEach((sciper, n) => buf.writeUInt32LE(sciper, n * 3));
    }
    bufferv.push(buf.slice(0, -1)); // slice is deprecated, but subarray doesn't return a Buffer...
  }
  return bufferv;
}

// This is a copy of github.com/dedis/cothority/external/js/kyber/src/curve/edwards25519/point.ts::embed
// because the embedding of an empty buffer does not work.
export const embed = (data) => {
    let dl = curve.point().embedLen();
    if (data.length > dl) {
        throw new Error("data.length > embedLen");
    }

    if (dl > data.length) {
        dl = data.length;
    }

    const pointObj = new curve.point();
    for (;;) {
        const buff = randomBytes(32);

        buff[0] = dl; // encode length in lower 8 bits
        if (dl > 0) {
            data.copy(buff, 1); // copy data into buff starting from the 2nd position
        }

        try {
            pointObj.unmarshalBinary(buff);
        } catch (e) {
            continue; // try again
        }

        // Verify it's on the curve by multiplying with the order of the base point
        const q = pointObj.clone();
        q.ref.point = q.ref.point.mul(curve.curve.n);
        if (q.ref.point.isInfinity()) {
            return pointObj;
        }
    }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  computed: {
    year() {
      return new Date().getFullYear();
    },
    election() {
      return this.$store.state.elections.find((e) => {
        return Uint8ArrayToHex(e.id) === this.$route.params.id;
      });
    },
    candidates() {
      const hideSet = new Set(config.candidatesToHide);
      return this.election.candidates.filter((c) => {
        return !hideSet.has(c);
      });
    },
    voted() {
      const shortId = Uint8ArrayToHex(this.election.id).substring(0, 10);
      return this.$store.state.voted[shortId];
    },
  },
  methods: {
    getId(election) {
      return Uint8ArrayToHex(election.id);
    },
    mi(election) {
      if (!election.moreinfolang[this.$i18n.locale]) {
        return election.moreinfo;
      }
      return election.moreinfolang[this.$i18n.locale];
    },
    endDate(timestamp) {
      return timestampToString(timestamp, true);
    },
    validateBallot(ballot) {
      const { election } = this;
      const i18n = this.$i18n;
      if (ballot.length <= election.maxchoices) {
        this.valid = true;
        return true;
      }
      this.valid = false;
      return i18n._t(
        "message.maxAllowed",
        i18n.locale,
        i18n._getMessages(),
        this,
        { max: election.maxchoices }
      );
    },
    dateStr(timestamp) {
      return timestampToString(timestamp, true);
    },
    submitHandler(e) {
      e.preventDefault();
      this.submitted = true;

      const { key } = this.election;
      // encrypt the ballot
      let { ballot } = this;
      ballot = new Set(ballot);
      const embedMsgv = encodeScipers(Array.from(ballot), this.election.maxchoices);

      const alphaBeta = embedMsgv.map((msg) => {
          // Calculate an ElGamal encryption
          const m = embed(msg);
          const r = curve.scalar().pick();
          // u = gr
          const u = curve.point().mul(r, null);
          // v = m + yr
          const y = curve.point();
          y.unmarshalBinary(key.subarray(8));
          const yr = curve.point().mul(r, y);
          const v = curve.point().add(m, yr);
          return [u.marshalBinary(), v.marshalBinary()];
      });
      const additionalAlphaBeta = alphaBeta.slice(1);

      // prepare and the message
      const cast = new Cast({
        id: this.election.id,
        ballot: new Ballot({
          user: parseInt(this.$store.state.user.sciper),
          alpha: alphaBeta[0][0],
          beta: alphaBeta[0][1],
          additionalalphas: additionalAlphaBeta.map((ab) => ab[0]),
          additionalbetas: additionalAlphaBeta.map((ab) => ab[1]),
        }),
        user: parseInt(this.$store.state.user.sciper),
        signature: getSig(),
      });
      this.$store.state.socket
        .send(cast, CastReply)
        .then((data) => {
          this.submitted = false;
          this.dialog3 = true;
          // Turn the block id we get back into a block number, which is more useful in
          // the skipchain explorer url.
          const roster = Roster.fromTOML(rosterTOML);
          const sc = new SkipchainRPC(roster);
          sc.getSkipBlock(data.id).then((b) => {
            this.$store.state.voted[
              Uint8ArrayToHex(this.election.id).substring(0, 10)
            ] = b.index;
          });
        })
        .catch((e) => {
          this.submitted = false;
          this.$store.commit("SET_SNACKBAR", {
            color: "error",
            text: e.message,
            model: true,
            timeout: 10000,
          });
        });
    },
  },
  data() {
    return {
      ballot: [],
      valid: false,
      submitted: false,
      candidateNames: {},
      version: version,
      dialog3: false,
    };
  },
  created() {
    const scipers = this.election.candidates;
    for (let i = 0; i < scipers.length; i++) {
      const sciper = scipers[i];
      this.candidateNames[sciper] =
        this.$store.state.names[sciper] || "loading...";
      if (this.candidateNames[sciper] !== "loading...") {
        continue;
      }
      var sltime = 0;
      if (i > 5) {
        sltime = 2000;
      }
      sleep(sltime).then(() => {
        if (sciper === 999999) {
          const i18n = this.$i18n;
          const ag = i18n._t(
            "message.notagree",
            i18n.locale,
            i18n._getMessages(),
            this
          );
          this.candidateNames = {
            ...this.candidateNames,
            [sciper]: ag,
          };
          return;
        }
        this.$store.state.socket
          .send(
            new LookupSciper({ sciper: sciper.toString() }),
            LookupSciperReply
          )
          .then((response) => {
            this.candidateNames = {
              ...this.candidateNames,
              [sciper]: response.fullname,
            };
            // cache
            this.$store.state.names[sciper] = this.candidateNames[sciper];
          })
          .catch(() => {
            this.candidateNames = {
              ...this.candidateNames,
              [sciper]: "SCIPER " + sciper + " not found",
            };
          });
      });
    }
  },
  watch: {
    candidateNames: {
      deep: true,
      handler() {},
    },
  },
};
</script>

<style>
.input-group label {
  overflow: visible;
}

.phone,
.email,
.version {
  padding: 0 5px;
}

.content {
  margin-top: 15px;
}
</style>
