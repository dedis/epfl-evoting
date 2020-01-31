<template>
  <v-layout row wrap>
    <v-flex xs12 sm12 offset-md3 md6>
      <v-card>
        <v-toolbar card dark :class="election.theme">
          <v-toolbar-title class="white--text">{{ $t(`election_${getId(election)}.name`) }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <div v-if="election.moreinfo">
            <a class="election-info" target="_blank" :href="election.moreinfo"><v-icon>info</v-icon></a>
          </div>
          <v-tooltip bottom>
            <v-icon slot="activator" class="results-download" @click="downloadVoteCount()">file_download</v-icon>
            <span>{{ $t('message.exportResults') }}</span>
          </v-tooltip>
          <div v-if="voted">
            <v-tooltip bottom>
              <v-icon dark class="election-voted" color="white" slot="activator">check</v-icon>
              <span>{{ $t('message.ballotCast', { block: voted }) }} </span>
            </v-tooltip>
          </div>
        </v-toolbar>
        <v-card-title>
          <v-container fluid>
            <v-layout>
              <v-flex xs12>
                {{ $t(`election_${getId(election)}.subtitle`) }}
              </v-flex>
            </v-layout>
            <div v-if="counted">
              <v-layout
                v-for="(val, idx) in sortCounts(counts)"
                :key="val.sciper"
                row
                wrap>
                <v-flex xs5 md3>
                  <p class="candidate">{{ candidateNames[val.sciper] }}</p>
                </v-flex>
                <v-flex xs5 md7>
                  <v-progress-linear :color="colors[(idx < election.maxchoices) ? 0 : 1]" :value="percentage(val.count, totalCount)"></v-progress-linear>
                </v-flex>
                <v-flex xs2 md2 class="text-md-center">
                  <span class="count">({{ val.count }}/{{ totalCount }})</span>
                </v-flex>
              </v-layout>
              <v-layout v-if="invalidCount === 1">
                <v-flex xs12>
                  <p>{{ $t('message.invalidBallot', { invalidCount })}}</p>
                </v-flex>
              </v-layout>
              <v-layout v-if="invalidCount > 1">
                <v-flex xs12>
                  <p>{{ $t('message.invalidBallots', { invalidCount })}}</p>
                </v-flex>
              </v-layout>
            </div>
            <div v-else>
              <v-layout>
                <v-flex xs12 class="text-xs-center">
                  <v-progress-circular indeterminate ></v-progress-circular>
                </v-flex>
              </v-layout>
            </div>
          </v-container>
        </v-card-title>
      </v-card>
    </v-flex>
    <v-footer app>
      <v-layout row wrap>
        <v-flex xs6 text-xs-left>
          &copy; {{ year }} {{ election.footer.text }}
        </v-flex>
        <v-flex xs6 text-xs-right>{{ election.footer.contactphone }}, <a :href="`mailto:${election.footer.contactemail}`">{{ election.footer.contacttitle }}</a> <span class="grey--text">v{{ version }}</span></v-flex>
      </v-layout>
    </v-footer>
  </v-layout>
</template>

<script>
import {
  Uint8ArrayToHex,
  timestampToString
} from '@/utils'
import version from '@/version'
import ReconstructWorker from '@/reconstruct.worker.js'
import { LookupSciper, LookupSciperReply } from '@/proto'

export default {
  computed: {
    year () {
      return (new Date()).getFullYear()
    },
    election () {
      return this.$store.state.elections.find(e => {
        return Uint8ArrayToHex(e.id) === this.$route.params.id
      })
    },
    voted () {
      const shortId = Uint8ArrayToHex(this.election.id).substring(0, 10)
      return this.$store.state.voted[shortId]
    }
  },
  methods: {
    downloadVoteCount () {
      // https://stackoverflow.com/a/18849208
      const filename = Uint8ArrayToHex(this.election.id).substring(0, 10) + '_result.csv'
      let comment = 'Ballot #,Candidates:'
      let row0 = [ '', ...this.election.candidates ]
      let rows = [ comment, row0.join(','), ...this.votes ]
      if (this.invalidBallots.length > 0) {
        rows.push('')
        rows.push('Invalid ballots:')
        rows.push(...this.invalidBallots)
      }
      const csvContent = rows.join('\n')

      // https://stackoverflow.com/a/24922761
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename)
      } else {
        const link = document.createElement('a')
        if (link.download !== undefined) {
          // Browsers that support HTML5 download attribute
          const url = URL.createObjectURL(blob)
          link.setAttribute('href', url)
          link.setAttribute('download', filename)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
    },
    getId (election) {
      return Uint8ArrayToHex(election.id)
    },
    candidates (data) {
      const arr = []
      for (let i = 0; i < data.length; i += 3) {
        const num = data[i] + data[i + 1] * (1 << 8) + data[i + 2] * (1 << 16)
        arr.push(num)
      }
      return arr
    },
    percentage (num, den) {
      return num / den * 100
    },
    endDate (timestamp) {
      return timestampToString(timestamp, true)
    },
    sortCounts (counts) {
      const arr = []
      for (let sciper in counts) {
        arr.push({ sciper, count: counts[sciper] })
      }
      return arr.sort((a, b) => b.count - a.count)
    }
  },
  data () {
    return {
      counts: {},
      totalCount: 0,
      candidateNames: {},
      votes: [],
      // color 0: elected, color 1: not elected
      colors: [
        'green accent-4',
        'yellow'
      ],
      invalidCount: 0,
      invalidBallots: [],
      counted: false,
      version: version
    }
  },
  created () {
    const c = this.election.candidates
    for (let i = 0; i < c.length; i++) {
      this.counts[c[i]] = 0
    }
    for (let i = 0; i < c.length; i++) {
      const sciper = c[i]
      if (sciper === 999999) {
        const i18n = this.$i18n
        const ag = i18n._t('message.notagree', i18n.locale, i18n._getMessages(), this)
        this.candidateNames[sciper] = ag
        continue
      }
      this.candidateNames[sciper] = this.$store.state.names[sciper] || 'loading...'
      if (this.candidateNames[sciper] !== 'loading...') {
        continue
      }
      this.$store.state.socket.send(new LookupSciper({ sciper: sciper.toString() }), LookupSciperReply)
        .then(response => {
          this.candidateNames = {...this.candidateNames, [sciper]: response.fullname}
          // cache
          this.$store.state.names[sciper] = this.candidateNames[sciper]
        })
        .catch(e => {
          this.candidateNames = {
            ...this.candidateNames,
            [sciper]: 'SCIPER ' + sciper + ' not found'
          }
        })
    }
    const worker = new ReconstructWorker()
    const wss = window.location.protocol === 'https:'
    worker.postMessage({ election: this.election, wss })
    worker.onmessage = e => {
      const { error, invalidCount, counts, votes, totalCount, invalidBallots } = e.data
      worker.terminate()
      if (error) {
        this.$store.commit('SET_SNACKBAR', {
          color: 'error',
          text: error,
          model: true,
          timeout: 10000
        })
        return
      }
      this.invalidCount = invalidCount
      this.invalidBallots = invalidBallots
      this.counts = counts
      this.votes = votes
      this.totalCount = totalCount
      this.counted = true
    }
    worker.onerror = e => {
      this.$store.commit('SET_SNACKBAR', {
        color: 'error',
        text: e.message,
        model: true,
        timeout: 10000
      })
    }
  },
  watch: {
    candidateNames: {
      deep: true,
      handler (val, oldVal) {}
    }
  }
}
</script>

<style scoped>
.candidate {
  line-height: 30px;
}

.count {
  line-height: 30px;
  font-size: 12px;
  font-weight: 500;
  padding: 0 5px;
}

.results-download {
  cursor: pointer;
  padding: 0 5px;
}
</style>
