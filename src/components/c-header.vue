<script setup lang="ts">
import { ComputedRef, computed, ref, toRefs } from "vue";
import { Dark, QForm, QMenu } from "quasar";
import { onMounted, Ref } from "vue";
import { useRouter } from "vue-router";

import CDialog from "@/components/c-dialog.vue";
import CRoundBtn from "@/components/c-round-btn.vue";

import authUtil from "@/modules/authUtil";
import util from "@/modules/util";
import { CacheUtil } from "@/modules/cacheUtil";
import validationUtil from "@/modules/validationUtil";
const cacheUtil = new CacheUtil();
const CACHE_KEY = {
  IS_DARK_MODE: "cache-isDarkMode",
};

const EMIT_NAME_ERROR = "show-error-dialog";
const emits = defineEmits(["show-error-dialog"]);
const emitError = (statusText: string, msg: string, status?: number) => {
  emits(EMIT_NAME_ERROR, status, statusText, msg);
};

const router = useRouter();

interface Menu {
  name: string;
  to: string;
  icon: string;
  description: string;
}
interface User {
  email: string;
}
interface Props {
  pageName: string;
  menus: Array<Menu>;
  user: User;
  isLoading: boolean;
  isAppLoaded: boolean;
}
const props = defineProps<Props>();

type DispMenu = Menu & {
  textColor: string;
  color: string;
};
const dispMenus: ComputedRef<DispMenu[]> = computed(() => {
  const isDarkMode = util.isDarkMode();
  return props.menus.map((menu) => {
    const path =
      router.currentRoute.value.path === "/"
        ? "/bookshelf"
        : router.currentRoute.value.path;
    const isCurrent = menu.to === path;
    let textColor = "";
    let color = "";
    if (isDarkMode) {
      textColor = isCurrent ? "dark" : "primary";
      color = isCurrent ? "primary" : "dark";
    } else {
      textColor = isCurrent ? "accent" : "dark";
      color = isCurrent ? "dark" : "accent";
    }
    return {
      ...menu,
      textColor,
      color,
    };
  });
});

const isDarkMode = ref(false);

const themeChangeTitle = computed(() => {
  const pre = isDarkMode.value ? "ライト" : "ダーク";
  return pre + "モードに切り替え";
});

const toggleMode = async () => {
  await setMode(!isDarkMode.value); //ダークモードをトグルして設定
};
const setMode = async (isDark: boolean) => {
  isDarkMode.value = isDark;
  Dark.set(isDark);

  // ダークモードの値をキャッシュに保存 1Month程度
  await cacheUtil.set(CACHE_KEY.IS_DARK_MODE, isDark, 24 * 30);
};

// 認証情報以外のキャッシュをクリアして画面更新
const clearCache = async () => {
  await cacheUtil.clear();
  window.location.reload();
};

const iconSize = "24px";

const iconSrc = util.getIconHref();

const loginDialogForm: Ref<QForm | undefined> = ref();
const loginDialog = ref({
  isShow: false,
  form: {
    email: "",
    password: "",
  },
  showPassword: false,
});
const showLoginDialog = () => {
  loginDialog.value.isShow = true;
  loginDialog.value.form = {
    email: "",
    password: "",
  };
  loginDialog.value.showPassword = false;
};
const login = async () => {
  if (!loginDialogForm.value) {
    return;
  }

  loginDialogForm.value.validate().then(async (success: boolean) => {
    if (!success) {
      return;
    }

    try {
      await authUtil.login(
        loginDialog.value.form.email,
        loginDialog.value.form.password
      );
    } catch (e) {
      console.error(e);
      // ログイン失敗時はエラーダイアログ出す
      emitError("ログインエラー", "ログインに失敗しました", 403);
    }
  });
};
const labels = {
  email: "メールアドレス",
  password: "パスワード",
};
const validationRules = {
  email: [
    validationUtil.isExist(labels.email),
    validationUtil.isEmail(labels.email),
  ],
  password: [
    validationUtil.isExist(labels.password),
    validationUtil.isPassword(labels.password),
  ],
};

const userInfoMenu: Ref<QMenu | undefined> = ref();

// Appコンポーネントのロードが終わった後、子コンポーネントの処理
// 初回ロードと画面遷移の療法に対応できるようにする
const { isAppLoaded } = toRefs(props);
onMounted(
  util.waitParentMount(isAppLoaded, async () => {
    // ダークモード情報をキャッシュから取り出して設定
    const cachedIsDarkMode = (await cacheUtil.get(CACHE_KEY.IS_DARK_MODE)) as
      | boolean
      | null;
    if (cachedIsDarkMode) {
      isDarkMode.value = cachedIsDarkMode;
    }
    await setMode(isDarkMode.value);

    // ログインしてなかったらメニュー開く
    if (!props.user.email) {
      showLoginDialog();
    }

    console.log("mounted c-header");
  })
);
</script>

<template>
  <q-header
    reveal
    elevated
    :class="[isDarkMode ? 'text-primary' : '', util.accentColorClasses.value]"
  >
    <q-toolbar>
      <q-toolbar-title shrink class="toolbar-title">
        <div @click="router.push('/')">
          <q-img
            :src="iconSrc"
            :width="iconSize"
            :height="iconSize"
            class="text-primary vertical-middle"
          ></q-img>
          <span class="vertical-middle q-mx-sm">{{ props.pageName }}</span>
        </div>
      </q-toolbar-title>
      <q-spinner-ios v-if="isLoading" size="36px" />

      <q-space></q-space>

      <!-- ヘッダーの遷移アイコンは引数からurlとアイコンと名前受け取る -->
      <c-round-btn
        v-for="menu in dispMenus"
        :key="menu.name"
        :title="menu.name"
        :icon="menu.icon"
        :to="menu.to"
        :color="menu.color"
        :text-color="menu.textColor"
        unelevated
        :is-flat="false"
      />
      <q-separator vertical inset color="" />
      <c-round-btn title="メニュー" icon="manage_accounts">
        <q-menu ref="userInfoMenu" :class="util.accentColorClasses.value">
          <q-list>
            <q-item v-if="user.email" v-close-popup>
              <q-item-section>{{ user.email }}</q-item-section>
            </q-item>

            <q-item clickable @click="toggleMode">
              <q-item-section>{{ themeChangeTitle }}</q-item-section>
            </q-item>
            <q-item clickable @click="clearCache">
              <q-item-section>キャッシュをクリアする</q-item-section>
            </q-item>

            <q-item
              v-if="user.email"
              v-close-popup
              clickable
              @click="authUtil.logout"
            >
              <q-item-section>ログアウト</q-item-section>
            </q-item>
            <q-item v-else v-close-popup clickable @click="showLoginDialog">
              <q-item-section>ログイン</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </c-round-btn>
    </q-toolbar>
    <c-dialog
      v-model="loginDialog.isShow"
      header-text="ログイン"
      ok-label="ログイン"
      @ok="login"
    >
      <q-form ref="loginDialogForm" class="login-dialog">
        <div class="row">
          <div class="col-12 q-pa-xs">
            <q-input
              v-model="loginDialog.form.email"
              type="email"
              clearable
              :label="labels.email"
              :rules="validationRules.email"
            ></q-input>
          </div>
          <div class="col-12 q-pa-xs">
            <q-input
              v-model="loginDialog.form.password"
              type="password"
              clearable
              :label="labels.password"
              :rules="validationRules.password"
            >
              <template #append>
                <q-icon
                  :name="
                    loginDialog.showPassword ? 'visibility_off' : 'visibility'
                  "
                  class="cursor-pointer"
                  @click="loginDialog.showPassword = !loginDialog.showPassword"
                />
              </template>
            </q-input>
          </div>
          <div class="col-12 q-pa-xs">
            <div v-if="loginDialog.showPassword">
              {{ loginDialog.form.password }}
            </div>
            <div v-else style="height: 21px"></div>
          </div>
        </div>
      </q-form>
    </c-dialog>
  </q-header>
</template>

<style scoped>
.toolbar-title {
  cursor: pointer;
}
</style>
