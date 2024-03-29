<template>
  <div v-if="$store.getters.hasElections">
    <div>
      <div v-if="$store.state.isadmin">
        <v-btn fixed fab dark bottom right to="/election/new" color="primary"
          ><font size="6">+</font></v-btn
        >
      </div>
      <div class="election-group">
        <h3>{{ $t("message.activeElections") }}</h3>
        <div v-if="noElections">
          <v-layout>
            <v-flex xs12>
              <v-card light color="yellow lighten-5">
                {{ $t("message.noElections") }}
              </v-card>
            </v-flex>
          </v-layout>
        </div>
        <v-layout
          v-for="(layout, idx) in active(elections)"
          :key="idx"
          class="election-cards"
          row
          wrap
        >
          <election-card
            v-for="election in layout"
            :key="getId(election.id)"
            :id="getId(election.id)"
            :name="election.name"
            :end="election.end"
            :start="election.start"
            :theme="election.theme"
            :creator="election.creator"
            :subtitle="election.subtitle"
            :moreInfo="mi(election)"
            :stage="election.stage"
          ></election-card>
        </v-layout>
      </div>
      <div class="election-group">
        <h3>{{ $t("message.finalizedElections") }}</h3>
        <v-layout
          v-for="(layout, idx) in finalized(elections)"
          :key="idx"
          class="election-cards"
          row
          wrap
        >
          <election-card
            v-for="election in layout"
            :key="getId(election.id)"
            :id="getId(election.id)"
            :name="election.name"
            :end="election.end"
            :start="election.start"
            :theme="election.theme"
            :creator="election.creator"
            :subtitle="election.subtitle"
            :moreInfo="mi(election)"
            :stage="election.stage"
          ></election-card>
        </v-layout>
      </div>
    </div>
    <div class="election-group">
      <h3>{{ $t("message.futureElections") }}</h3>
      <v-layout
        v-for="(layout, idx) in future(elections)"
        :key="idx"
        class="election-cards"
        row
        wrap
      >
        <election-card
          v-for="election in layout"
          :key="getId(election.id)"
          :id="getId(election.id)"
          :name="election.name"
          :end="election.end"
          :start="election.start"
          :theme="election.theme"
          :creator="election.creator"
          :subtitle="election.subtitle"
          :moreInfo="mi(election)"
          :stage="election.stage"
        ></election-card>
      </v-layout>
    </div>
    <v-footer fixed padless>
      <v-col class="text-center" cols="12">
        <span class="pa-2 grey--text">v{{ version }}</span>
      </v-col>
    </v-footer>
  </div>
  <div v-else>
    <v-layout row wrap align-center>
      <v-flex xs12 class="text-xs-center">
        <div v-if="$store.getters.hasElections">
          <p>Welcome, {{ $store.state.user.name }}</p>
        </div>
        <div v-else>
          <v-progress-circular :indeterminate="true" :size="50" />
        </div>
      </v-flex>
    </v-layout>
  </div>
</template>

<style>
.election-group {
  border-bottom: 1px solid #eee;
  padding: 1rem 0;
  margin: 0.5rem 0;
}

.election-cards {
  margin-left: -1rem;
}
</style>

<script>
import ElectionCard from "./ElectionCard";
import { Uint8ArrayToHex } from "@/utils";
import config from "@/config";
import version from "@/version";
import store from "@/store";

const createArray = (filteredArray) => {
  const res = [];
  let tmp = [];
  filteredArray.forEach((e, i) => {
    if (i > 0 && i % 3 === 0) {
      res.push(tmp);
      tmp = [];
    }
    tmp.push(e);
  });
  if (tmp.length > 0) {
    res.push(tmp);
  }
  return res;
};

const hidden = (id) => {
  id = Uint8ArrayToHex(id);
  if (!config.electionsToHide) {
    return false;
  }
  return config.electionsToHide.includes(id);
};

export default {
  components: {
    "election-card": ElectionCard,
  },
  methods: {
    mi(election) {
      if (!election.moreinfolang[this.$i18n.locale]) {
        return election.moreinfo;
      }
      return election.moreinfolang[this.$i18n.locale];
    },
    active: (elections) => {
      var act = createArray(
        elections.filter((e) => {
          const now = Date.now() / 1000;
          if (hidden(e.id)) {
            return false;
          }
          return e.stage < 3 && now > e.start && now < e.end;
        })
      );
      return act;
    },
    finalized: (elections) => {
      return createArray(
        elections.filter((e) => {
          if (hidden(e.id)) {
            return false;
          }
          if (store.state.isadmin) {
            // Show admins all, so they can finalise them.
            return true;
          } else {
            return e.stage === 3;
          }
        })
      );
    },
    future: (elections) => {
      return createArray(
        elections.filter((e) => {
          const now = new Date();
          if (hidden(e.id)) {
            return false;
          }
          return now < new Date(1000 * e.start);
        })
      );
    },
    getId: (id) => {
      return Uint8ArrayToHex(id);
    },
  },
  computed: {
    elections() {
      return this.$store.getters.elections;
    },
    noElections() {
      return this.active(this.$store.getters.elections).length === 0;
    },
  },
  data() {
    return {
      version: version,
    };
  },
};
</script>
