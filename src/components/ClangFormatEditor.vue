<template>
  <v-container fluid>
    {{ test }}
    <!-- Toolbar -->
    <v-row>
      <v-col>
        <v-toolbar dense color="white">
          <!-- Language -->
          <v-radio-group v-model="select_lang" mandatory row hide-details>
            <v-radio
              v-for="(lang, i) in lang_options"
              :key="i"
              :label="lang"
              :value="lang"
            ></v-radio>
          </v-radio-group>

          <v-divider vertical inset color="white" class="mx-3"></v-divider>

          <v-btn depressed class="mr-2" @click="uploadConfig">
            {{ this.select_lang == "EN" ? "Upload" : "アップロード" }}
          </v-btn>
          <input
            ref="uploader"
            type="file"
            @change="onFileChanged"
            style="display:none"
          />
          <v-btn depressed class="mr-2" @click="saveConfig">
            {{ this.select_lang == "EN" ? "Save" : "保存" }}
          </v-btn>
          <v-btn depressed class="mr-2" @click="resetConfig">
            {{ this.select_lang == "EN" ? "Reset" : "リセット" }}
          </v-btn>

          <!-- Dialog -->
          <v-dialog v-model="dialog" width="900">
            <v-card>
              <v-card-title class="text-h5 grey lighten-2">
                Uploaded .clang-format has been applied.
              </v-card-title>

              <v-card-text class="mt-3"
                ><pre>{{ ret_msg }}</pre></v-card-text
              >

              <v-divider></v-divider>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="dialog = false">
                  OK
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-divider vertical inset color="white" class="mx-3"></v-divider>

          <!-- Categories -->
          <v-radio-group v-model="select_category" mandatory row hide-details>
            <v-radio label="All" value="All"></v-radio>
            <v-radio
              v-for="(category, i) in category_options"
              :key="i"
              :label="category"
              :value="category"
            ></v-radio>
          </v-radio-group>
        </v-toolbar>
      </v-col>
    </v-row>
    <v-row>
      <!-- Options -->
      <v-col>
        <!-- table -->
        <v-data-table
          :headers="headers"
          :items="items"
          disable-pagination
          hide-default-footer
          @click:row="selectOption"
          :search="select_category"
          :custom-filter="filterByCategory"
        >
          <template #[`item.value`]="{ item }">
            <!-- int type -->
            <template v-if="item.type == 'int'">
              <v-text-field
                v-model="values[item.name]"
                placeholder="Default"
                hide-details
                single-line
                type="number"
                outlined
                dense
                clearable
              />
            </template>
            <!-- unsigned type -->
            <template v-else-if="item.type == 'unsigned'">
              <v-text-field
                v-model="values[item.name]"
                placeholder="Default"
                hide-details
                single-line
                type="number"
                min="0"
                outlined
                dense
                clearable
              />
            </template>
            <!-- enum type -->
            <template v-else-if="item.enums">
              <v-select
                placeholder="Default"
                v-model="values[item.name]"
                :items="item.enums"
                dense
                item-text="name"
                item-value="name"
                clearable
              >
              </v-select>
            </template>
            <!-- bool type -->
            <template v-else-if="item.type == 'bool'">
              <v-select
                v-model="values[item.name]"
                placeholder="Default"
                :items="[true, false]"
                dense
                clearable
              >
              </v-select>
            </template>
            <!-- string type -->
            <template
              v-else-if="item.type == 'string' || item.type == 'list of string'"
            >
              <v-text-field
                v-model="values[item.name]"
                hide-details
                outlined
                dense
                clearable
              />
            </template>
          </template>
        </v-data-table>
      </v-col>
      <!-- Description -->
      <v-col>
        <div class="sticky">
          <v-card flat>
            <v-card-title>
              {{
                this.select_lang == "EN"
                  ? "Option Description"
                  : "オプションの説明"
              }}
            </v-card-title>

            <v-card-text v-if="select_item">
              <div v-html="select_item.description" class="description"></div>

              <div v-if="select_item.enums">
                <li v-for="(item, i) in select_item.enums" :key="i">
                  {{ item.name }}
                  <div v-html="item.description"></div>
                </li>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import data_jp from "../assets/data_jp.json";
import data_en from "../assets/data_en.json";
import "prismjs/themes/prism-twilight.css";
import Prism from "prismjs";

export default {
  name: "ClangFormatEditor",

  data: () => ({
    headers: [
      {
        text: "Option",
        sortable: false,
        value: "name"
      },
      {
        text: "Value",
        sortable: false,
        value: "value"
      }
    ],
    lang_options: ["EN", "JP"],
    category_options: [],
    test: null,
    ////////////////////
    data_jp: data_jp,
    data_en: data_en,
    ////////////////////
    values: null,
    select_option: null,
    select_category: null,
    select_lang: "EN",
    brace_wrapping_options: [],
    dialog: false,
    ret_msg: ""
  }),

  created() {
    // 入力値
    this.values = {};
    for (let item of this.items) {
      this.$set(this.values, item.name, null);
    }

    // カテゴリ一覧を取得する。
    this.category_options = this.items
      .map(x => x.category)
      .filter((v, i, a) => a.indexOf(v) === i);

    this.brace_wrapping_options = this.items
      .filter(v => "parent" in v)
      .map(x => x.name);
  },

  computed: {
    items() {
      return this.select_lang == "EN" ? data_en : data_jp;
    },

    select_item() {
      return this.items.find(x => x.name == this.select_option);
    }
  },

  methods: {
    createConfig() {
      let brace_wrapping_values = [];
      let normal_values = [];
      for (const [key, value] of Object.entries(this.values)) {
        if (value == null) continue; // デフォルト設定

        if (this.brace_wrapping_options.indexOf(key) != -1) {
          // BraceWrapping の設定の場合
          brace_wrapping_values.push({ key: key, value: value });
        } else {
          // 通常の設定の場合
          normal_values.push({ key: key, value: value });
        }
      }

      // 通常の設定
      let s = "";
      for (const item of normal_values) {
        s += `${item.key}: ${item.value}\n`;
      }

      // BraceWrapping の設定
      if (brace_wrapping_values.length != 0) {
        s += "BreakBeforeBraces: Custom\n";
        s += "BraceWrapping:\n";
        for (const item of brace_wrapping_values) {
          s += `  ${item.key}: ${item.value}\n`;
        }
      }

      s = s.replace(/'/g, '"');

      return s;
    },

    // 設定をアップロードする。
    uploadConfig() {
      this.$refs.uploader.click();
    },

    // 設定をダウンロードする。
    saveConfig() {
      let blob = new Blob([this.createConfig()], { type: "text/yaml" });
      let link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = ".clang-format";
      link.click();
    },

    // 設定をリセットする。
    resetConfig() {
      for (let key of Object.keys(this.values)) {
        this.values[key] = null;
      }
    },

    selectOption(item) {
      this.select_option = item.name;
    },

    filterByCategory(value, category, item) {
      return category == "All" || item.category === category;
    },

    onFileChanged(e) {
      const files = e.target.files || e.dataTransfer.files;
      if (files.length == 0) return;

      if (files[0].name != ".clang-format") return;

      this.readFileAsync(files[0]).then(this.parseConfig);
    },

    parseConfig(config) {
      function isUnsignedInteger(str) {
        var n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str && n >= 0;
      }

      function isInteger(str) {
        var n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str;
      }

      function isBool(str) {
        return str == "true" || str == "false";
      }

      function isValidEnumerator(str, enums) {
        for (let e of enums) {
          if (str == e.name) return true;
        }

        return false;
      }

      let config_list = {};
      for (let item of this.items) {
        config_list[item.name] = item;
      }

      this.ret_msg = "";
      for (let line of config.split(/\r?\n/)) {
        line = line.trim();
        if (line == "") continue; // 空行は無視する。

        if (line.startsWith("#")) continue; // コメントは無視する。

        let tokens = line.split(":");
        let name = tokens[0].trim();
        let value = tokens[1].trim();

        if (name == "BraceWrapping") continue;

        if (!config_list[name]) {
          this.ret_msg += `Warning: Unknown option '${name}' found.\n`;
          continue;
        }

        if (config_list[name].type == "int" && !isInteger(value)) {
          this.ret_msg += `Warning: Option '${name}' should be integer. value '${value}' found.\n`;
          continue;
        }

        if (config_list[name].type == "unsigned" && !isUnsignedInteger(value)) {
          this.ret_msg += `Warning: Option '${name}' should be unsigned integer. value '${value}' found.\n`;
          continue;
        }

        if (config_list[name].type == "bool" && !isBool(value)) {
          this.ret_msg += `Warning: Option '${name}' should be boolean. value '${value}' found.\n`;
          continue;
        }

        if (
          config_list[name].type == "enum" &&
          !isValidEnumerator(value, config_list[name].enums)
        ) {
          let valid_enums = config_list[name].enums.map(x => x.name).join();
          this.ret_msg += `Warning: Option '${name}' should be one of ${valid_enums}. value '${value}' found.\n`;
          continue;
        }

        this.values[name] = value;
      }
      this.ret_msg += ".clang-format file loaded successfully.\n";

      this.dialog = true;
    },

    readFileAsync(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
  },

  mounted() {
    Prism.highlightAll();
  }
};
</script>

<style>
.sticky {
  position: fixed;
  top: 100;
  width: 500px;
  height: 700px;
  overflow-y: scroll;
}

.v-application pre > code {
  all: unset !important;
}

.description {
  white-space: pre-wrap;
}
</style>
