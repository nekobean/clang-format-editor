<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <h1>Clang Format Editor (Clang 13) version 0.3.0</h1>
      
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
    title: "Clang Format Editor (compatible with Clang 13)",
    titleTemplate: "%s - pystyle"
  },

  components: {
    ClangFormatEditor
  },
  data: () => ({})
};
</script>
