<template>
  <button class="w-full h-12 rounded-lg text-gray-200 uppercase font-semibold text-gray-100 transition mb-4 bg-gray-800 hover:bg-gray-800"
          :class="this.buttonClass" :disabled="this.disabled" @click="login()">
    {{ this.buttonText }}
  </button>
</template>

<script>
import { loginSessionKey, putLocalStorage } from "@/components/storage";

export default {
  props: {
    disabled: {
      type: Boolean,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      required: true,
    },
    buttonClass: {
      type: String
    },
    loginRoute: {
      type: String
    }
  },
  data() {
    return {
      configuration: this.$store.state.configuration.ui.loginProviders[this.provider],
      scope: "openid profile email",
      loggingIn: false,
    };
  },
  mounted() {
  },
  methods: {
    async login() {
      this.loggingIn = true;
      let response = await this.$http.get({ route: this.loginRoute });
      let { url, code_verifier } = await response.json();
      putLocalStorage({ key: loginSessionKey, data: { code_verifier } });
      window.location.href = url;
    }
  }
};
</script>
