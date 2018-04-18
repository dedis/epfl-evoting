<template>
  <div v-if='$store.getters.hasElections'>
    <div>
      <div v-if="$store.state.isAdmin">
        <v-btn
          fixed
          dark
          fab
          bottom
          right
          to="/election/new"
          color="primary"
        >
          <v-icon>add</v-icon>
        </v-btn>
      </div>
      <div class="election-group">
        <h3>{{ $t("message.activeElections") }}</h3>
        <v-layout
          v-for="(layout, idx) in active(elections)"
          :key="idx"
          class="election-cards"
          row
          wrap>
          <election-card
            v-for="election in layout" :key="getId(election.id)"
            :id="getId(election.id)"
            :name="election.name"
            :end="election.end"
            :start="election.start"
            :theme="election.theme"
            :creator="election.creator"
            :subtitle="election.subtitle"
            :moreInfo="election.moreInfo"
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
          wrap>
          <election-card
            v-for="election in layout" :key="getId(election.id)"
            :id="getId(election.id)"
            :name="election.name"
            :end="election.end"
            :start="election.start"
            :theme="election.theme"
            :creator="election.creator"
            :subtitle="election.subtitle"
            :moreInfo="election.moreInfo"
            :stage="election.stage"></election-card>
        </v-layout>
      </div>
    </div>
  </div>
  <div v-else>
    <v-layout row wrap align-center>
      <v-flex xs12 class='text-xs-center'>
        <div v-if='$store.getters.hasElections'>
          <p>Welcome, {{ $store.state.user.name }}</p>
        </div>
        <div v-else>
          <v-progress-circular :indeterminate='true' :size="50" />
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
import ElectionCard from './ElectionCard'
import { Uint8ArrayToHex } from '@/utils'

const createArray = filteredArray => {
  const res = []
  let tmp = []
  filteredArray.forEach((e, i) => {
    if (i > 0 && i % 3 === 0) {
      res.push(tmp)
      tmp = []
    }
    tmp.push(e)
  })
  if (tmp.length > 0) {
    res.push(tmp)
  }
  return res
}

export default {
  components: {
    'election-card': ElectionCard
  },
  methods: {
    active: (elections) => {
      return createArray(elections.filter(e => {
        return e.stage === 1
      }))
    },
    finalized: (elections) => {
      return createArray(elections.filter(e => {
        return e.stage === 3
      }))
    },
    getId: (id) => {
      return Uint8ArrayToHex(id)
    }
  },
  computed: {
    elections () {
      return this.$store.getters.elections
    }
  }
}
</script>
