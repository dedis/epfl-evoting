<script>
import config from '../config'
export default {
  mounted () {
    document.cookie = 'signature=; path=/'
    this.$store.commit('SET_USER', null)
    this.$store.commit('SET_ELECTIONS', null)
    const urlaccess = window.location.protocol + '//' + window.location.host
    window.location.replace(`https://${config.tequila.hostname}/cgi-bin/tequila/logout?urlaccess=${urlaccess}`)
  }
}
</script>
