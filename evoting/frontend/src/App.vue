<template>
  <v-app>
    <navbar :title="title" />
    <!--<main>-->
    <v-container class="root-container" fluid full-height>
      <v-card class="mb-3">
        <v-breadcrumbs :items="breadcrumbs" divider=">">
          <v-breadcrumbs-item
            slot="item"
            slot-scope="{ item }"
            :href="item.href"
            target="_blank"
            :key="item.text"
          >
            {{ $t(`message.${item.text}`) }}
          </v-breadcrumbs-item>
        </v-breadcrumbs>
      </v-card>
      <div v-if="maintenance">
        <v-card light color="yellow lighten-5">
          {{ $t("message.maint") }}
        </v-card>
      </div>
      <div v-if="!maintenance">
        <router-view />
      </div>
      <v-snackbar
        :timeout="$store.getters.snackbar.timeout"
        :color="$store.getters.snackbar.color"
        v-model="$store.getters.snackbar.model"
      >
        {{ $store.getters.snackbar.text }}
        <v-btn dark text @click.native="$store.state.snackbar.model = false"
          >Close</v-btn
        >
      </v-snackbar>
    </v-container>
  </v-app>
</template>

<script>
import Navbar from "./components/Navbar";
import config from "@/config";
import { getSig } from "@/utils";
import { GetElections, GetElectionsReply } from "@/proto";

export default {
  components: {
    navbar: Navbar,
  },
  data() {
    const i18n = this.$i18n;
    return {
      fixed: false,
      title: i18n._t(
        "message.elections",
        i18n.locale,
        i18n._getMessages(),
        this
      ),
      breadcrumbs: config.breadcrumbs,
      maintenance: config.maintenance,
    };
  },
  mounted() {
    setInterval(() => {
      this.$store.commit("SET_NOW", Math.floor(new Date().getTime() / 1000));
    }, 60000);

    setInterval(() => {
      const { socket, user } = this.$store.state;
      const ge = new GetElections({
        user: parseInt(user.sciper),
        master: config.masterID,
        stage: 0,
        signature: getSig(),
      });
      socket.send(ge, GetElectionsReply).then((reply) => {
        this.$store.commit("SET_ELECTIONS", reply.elections);
        this.$store.commit("SET_ISADMIN", reply.isadmin);
      });
    }, 570000);
  },
  name: "App",
};
</script>

<style scope>
.theme--light .breadcrumbs li:last-child .breadcrumbs__item {
  color: #1976d2 !important;
}
</style>

<style>
.epfl {
  background-color: #ae0010 !important;
}

.enac {
  background-color: #ea5e00 !important;
}

.sb {
  background-color: #007ba5 !important;
}

.sti {
  background-color: #8972d5 !important;
}

.ic {
  background-color: #1bb5b5 !important;
}

.sv {
  background-color: #6fba01 !important;
}

.cdm {
  background-color: #990165 !important;
}

.cdh {
  background-color: #daa521 !important;
}

.inter {
  background-color: #895116 !important;
}

.assoc {
  background-color: #aebd00 !important;
}

.election-info {
  text-decoration: none !important;
}

.election-voted {
  padding: 0 5px;
  cursor: pointer;
}
</style>
