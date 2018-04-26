<template>
  <div>
  <v-toolbar
    app
  >
    <div class="logo">
      <a href="/"><img src="@/assets/epfl_logo.png"></a>
    </div>
    <v-toolbar-title v-text="title"></v-toolbar-title>
    <v-spacer></v-spacer>
    <v-toolbar-items>
      <v-menu offset-y>
        <v-btn slot="activator" icon><v-icon>translate</v-icon></v-btn>
        <v-list>
          <v-list-tile @click="changeLanguage('fr')">
            <v-list-tile-title>Français</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="changeLanguage('de')">
            <v-list-tile-title>Deutsch</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="changeLanguage('it')">
            <v-list-tile-title>Italiano</v-list-tile-title> </v-list-tile>
          <v-list-tile @click="changeLanguage('en')">
            <v-list-tile-title>English</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-toolbar-items>
    <v-toolbar-items v-if="$store.getters.hasElections" class="hidden-md-and-up">
      <v-menu>
        <v-btn slot="activator" icon><v-icon>more_vert</v-icon></v-btn>
        <v-list>
	  <v-list-tile href="http://voting-web-prod.epfl.ch/">
            <v-list-tile-avatar><v-icon color="grey lighten-2">group_work</v-icon></v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title color="grey lighten-2">{{ $t("message.howItWorks") }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-avatar><v-icon>account_circle</v-icon></v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ $store.state.user.name }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile to="/logout">
            <v-list-tile-avatar><v-icon>exit_to_app</v-icon></v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ $t("message.logout") }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-toolbar-items>
    <v-toolbar-items v-if="$store.getters.hasElections" class="hidden-sm-and-down">
        <v-btn ripple="false" href="http://voting-web-prod.epfl.ch/" flat><v-icon color="grey lighten-2">group_work</v-icon></v-btn>
        <v-btn flat>{{ $store.state.user.name }}</v-btn>
        <v-btn to="/logout" flat><v-icon>exit_to_app</v-icon></v-btn>
    </v-toolbar-items>
  </v-toolbar>
  </div>
</template>

<style>
  .logo img {
    width: 108px;
    padding: 5px 0 0 0;
  }
</style>

<script>
export default {
  props: {
    title: String
  },
  methods: {
    changeLanguage: function (lang) {
      this.$i18n.locale = lang
    }
  },
  data () {
    return {
    }
  }
}
</script>
