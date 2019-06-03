<template>
  <div class="flex xs12 sm12 md4 election-card">
    <v-card>
      <v-toolbar card dark :class="theme">
        <v-toolbar-title class="white--text">{{ $t(`election_${this.id}.name`)}}</v-toolbar-title>
        <v-spacer></v-spacer>
        <div v-if="moreInfo">
          <a class="election-info" target="_blank" :href="moreInfo"><v-icon>info</v-icon></a>
        </div>
        <div v-if="voted">
          <a :href="explorerUrl" target="_blank">
            <v-tooltip bottom>
              <v-icon dark class="election-voted" color="white" slot="activator">check</v-icon>
              <span>{{ $t('message.ballotCast', { block: voted }) }}</span>
            </v-tooltip>
          </a>
        </div>
      </v-toolbar>
      <v-card-title class="election-card-name">
        <v-layout>
          <v-flex xs12>{{ $t(`election_${this.id}.subtitle`) }}</v-flex>
        </v-layout>
      </v-card-title>
      <v-card-actions>
        <v-layout row wrap>
        <v-flex v-if="stage < 3" xs6>
          <v-btn :disabled="stage == 2 || disabled || (!$store.state.config.ignoreDateRange && ($store.state.now > end || $store.state.now < start))" :to="voteLink" color="primary">{{ $t("message.vote") }}</v-btn>
        </v-flex>
        <v-flex v-if="$store.state.isadmin && stage < 3 && creator === parseInt($store.state.user.sciper)" class="text-xs-right" xs6>
          <v-btn :disabled="disabled || $store.state.now < start" v-on:click.native="finalize" color="orange">{{ $t("message.finalize") }} </v-btn>
        </v-flex>
        <v-flex v-if="stage === 3" xs12>
          <v-btn :disabled="disabled" :to="resultLink" color="success">{{ $t("message.viewResults") }}</v-btn>
        </v-flex>
        </v-layout>
      </v-card-actions>
    </v-card>
  </div>
</template>


<style>
.election-card {
  padding: 1rem;
}
</style>

<script>
import config from '@/config'
import { hexToUint8Array, timestampToString, getSig } from '@/utils'
import { GetElections, GetElectionsReply, Shuffle, ShuffleReply, Decrypt, DecryptReply } from '@/proto'

export default {
  computed: {
    explorerUrl () {
      return `http://voting-web-prod.epfl.ch/#${this.id}/blocks/${this.voted}`
    },
    endDate () {
      return timestampToString(this.end, true)
    },
    voted () {
      return this.$store.state.voted[this.id.substring(0, 10)]
    }
  },
  props: {
    // name: String,
    end: Number,
    start: Number,
    creator: Number,
    // subtitle: String,
    moreInfo: String,
    stage: Number,
    id: String,
    theme: String
  },
  methods: {
    async finalize (event) {
      const { socket } = this.$store.state
      this.disabled = true
      let { sciper, signature } = this.$store.state.user
      const msg = {
        id: hexToUint8Array(this.id),
        user: parseInt(sciper),
        signature: getSig()
      }
      const setError = (e) => {
        this.$store.commit('SET_SNACKBAR', {
          color: 'error',
          text: e.message,
          model: true,
          timeout: 10000
        })
        this.disabled = false
      }
      try {
        await socket.send(new Shuffle(msg), ShuffleReply)
      } catch (e) {
        setError(e)
        if (e.message.indexOf('already shuffled') === -1) {
          throw e
        }
      }
      try {
        await socket.send(new Decrypt(msg), DecryptReply)
        this.$store.commit('SET_SNACKBAR', {
          color: 'success',
          text: 'Election finalized',
          model: true,
          timeout: 10000
        })
        this.disabled = false
        const master = config.masterID
        const ge = new GetElections({
          user: sciper,
          master,
          stage: 0,
          signature
        })
        const response = await socket.send(ge, GetElectionsReply)
        this.$store.commit('SET_ELECTIONS', response.elections)
        this.$store.commit('SET_ISADMIN', response.isadmin)
        this.$router.push('/')
      } catch (e) {
        setError(e)
      }
    }
  },
  data () {
    return {
      show: false,
      voteLink: `/election/${this.id}/vote`,
      resultLink: `/election/${this.id}/results`,
      disabled: false,
      candidateNames: []
    }
  },
  created () {
  }
}
</script>
