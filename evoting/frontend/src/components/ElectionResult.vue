<template>
  <v-layout row wrap>
    <v-flex sm12 offset-md3 md6>
      <v-card>
        <v-toolbar card dark :class="election.theme">
          <v-toolbar-title class="white--text">{{ $t(`election_${getId(election)}.name`) }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <div v-if="election.moreInfo">
            <a class="election-info" target="_blank" :href="election.moreInfo"><v-icon>info</v-icon></a>
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
                  <v-progress-linear :color="colors[idx % colors.length]" :value="percentage(val.count, totalCount)"></v-progress-linear>
                </v-flex>
                <v-flex xs2 md2 class="text-md-center">
                  <span class="count">({{ val.count }}/{{ totalCount }})</span>
                </v-flex>
              </v-layout>
              <v-layout v-if="invalidCount > 0">
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
          &copy; 2018 {{ election.footer.text }}
        </v-flex>
        <v-flex xs6 text-xs-right>{{ election.footer.contactPhone }}, <a :href="`mailto:${election.footer.contactEmail}`">{{ election.footer.contactTitle }}</a> <span class="grey--text">v{{ version }}</span></v-flex>
      </v-layout>
    </v-footer>
  </v-layout>
</template>

<script>
import {
  Uint8ArrayToHex,
  timestampToString
} from '@/utils'
import config from '@/config'
import ReconstructWorker from '@/reconstruct.worker.js'

export default {
  computed: {
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
      const csvContent = this.votes.join('\n')

      // https://stackoverflow.com/a/24922761
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename)
      } else {
        const link = document.createElement('a')
        if (link.download !== undefined) {
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob)
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
      colors: [
        'green accent-4',
        'green accent-3',
        'green accent-2',
        'yellow lighten-2',
        'yellow lighten-1',
        'yellow',
        'yellow darken-1',
        'yellow darken-2',
        'yellow darken-3',
        'amber',
        'amber darken-1',
        'amber darken-2',
        'amber darken-3',
        'amber darken-4',
        'orange',
        'orange darken-1',
        'orange darken-2',
        'orange darken-3',
        'orange darken-4'
      ],
      invalidCount: 0,
      counted: false,
      version: config.version
    }
  },
  created () {
    const c = this.election.candidates
    for (let i = 0; i < c.length; i++) {
      this.counts[c[i]] = 0
    }
    for (let i = 0; i < c.length; i++) {
      const sciper = c[i]
      this.candidateNames[sciper] = this.$store.state.names[sciper] || null
      if (this.candidateNames[sciper]) {
        continue
      }
      this.$store.state.socket.send('LookupSciper', 'LookupSciperReply', {
        sciper: sciper.toString()
      })
        .then(response => {
          this.candidateNames = {...this.candidateNames, [sciper]: response.fullName}
          // cache
          this.$store.state.names[sciper] = this.candidateNames[sciper]
        })
    }
    const worker = new ReconstructWorker()
    worker.postMessage(this.election)
    worker.onmessage = e => {
      const { error, invalidCount, counts, votes, totalCount } = e.data
      worker.terminate()
      if (error) {
        this.$store.commit('SET_SNACKBAR', {
          color: 'error',
          text: error,
          model: true,
          timeout: 6000
        })
        return
      }
      this.invalidCount = invalidCount
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
        timeout: 6000
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
