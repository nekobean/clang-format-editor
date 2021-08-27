<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <h1>Clang Format Editor (Clang 12) version 0.2.0</h1>
    </v-app-bar>

    <v-main>
      <ClangFormatEditor />
    </v-main>
  </v-app>
</template>

<script>
import ClangFormatEditor from "./components/ClangFormatEditor";

export default {
  name: "App",
  metaInfo: {
    title: "Clang Format Editor (compatible with Clang 12)",
    titleTemplate: "%s - pystyle"
  },

  components: {
    ClangFormatEditor
  },
  data: () => ({})
};
</script>
