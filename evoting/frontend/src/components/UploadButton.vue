<!-- From https://github.com/jannhama/vuetify-upload-btn/blob/master/UploadButton.vue -->
<template>
  <div class="btn btn-primary jbtn-file">
    {{ title }}<input type="file" v-on:change="fileSelected" />
  </div>
</template>

<script>
export default {
  name: "upload-button",
  props: {
    selectedCallback: Function,
    title: String,
  },
  methods: {
    fileSelected(e) {
      if (this.selectedCallback) {
        if (e.target.files[0]) {
          this.selectedCallback(e.target.files[0]);
        } else {
          this.selectedCallback(null);
        }
      }
    },
  },
};
</script>

<style scoped>
</style>
