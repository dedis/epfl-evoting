<template>
  <div>
    <v-app-bar>
      <div class="logo">
        <a href="/"><img src="@/assets/epfl_logo.png" /></a>
      </div>
      <v-app-bar-title v-text="title"></v-app-bar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" text><v-icon>mdi-translate</v-icon></v-btn>
          </template>
          <v-list>
            <v-list-item @click="changeLanguage('fr')">
              <v-list-item-title>Français</v-list-item-title>
            </v-list-item>
            <v-list-item @click="changeLanguage('de')">
              <v-list-item-title>Deutsch</v-list-item-title>
            </v-list-item>
            <v-list-item @click="changeLanguage('it')">
              <v-list-item-title>Italiano</v-list-item-title>
            </v-list-item>
            <v-list-item @click="changeLanguage('en')">
              <v-list-item-title>English</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar-items>
      <v-toolbar-items
        v-if="$store.getters.hasElections"
        class="hidden-md-and-up"
      >
        <v-menu>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" text><v-icon>mdi-dots-vertical</v-icon></v-btn>
          </template>
          <v-list>
            <v-list-item :href="explorerUrl">
              <v-list-item-avatar
                ><v-icon>mdi-account-group</v-icon></v-list-item-avatar
              >
              <v-list-item-content>
                <v-list-item-title>{{
                  $t("message.howItWorks")
                }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-avatar
                ><v-icon>mdi-account-circle</v-icon></v-list-item-avatar
              >
              <v-list-item-content>
                <v-list-item-title>{{
                  $store.state.user ? $store.state.user.name : ""
                }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item to="/logout">
              <v-list-item-avatar
                ><v-icon>mdi-exit-to-app</v-icon></v-list-item-avatar
              >
              <v-list-item-content>
                <v-list-item-title>{{
                  $t("message.logout")
                }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar-items>
      <v-toolbar-items
        v-if="$store.getters.hasElections"
        class="hidden-sm-and-down"
      >
        <v-btn :href="explorerUrl" target="_blank" text
          ><v-icon>mdi-account-group</v-icon></v-btn
        >
        <v-btn text>{{
          $store.state.user ? $store.state.user.name : ""
        }}</v-btn>
        <v-btn to="/logout" text><v-icon>mdi-exit-to-app</v-icon></v-btn>
      </v-toolbar-items>
    </v-app-bar>
  </div>
</template>

<style>
.logo img {
  width: 108px;
  padding: 5px 0 0 0;
}
</style>

<script>
import config from "@/config";
import { Uint8ArrayToHex } from "@/utils";

export default {
  props: {
    title: String,
  },
  methods: {
    changeLanguage: function (lang) {
      this.$i18n.locale = lang;
    },
  },
  data() {
    return {};
  },
  computed: {
    explorerUrl() {
      return `${config.explorerUrl}#/${Uint8ArrayToHex(config.masterID)}/graph`;
    },
  },
};
</script>
