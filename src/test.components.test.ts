
// コンポーネントのテスト
import { Quasar } from 'quasar';
import {describe, expect, test} from "vitest";
import {mount} from "@vue/test-utils";
const mountWrapper = (component:any, propsData:any) => mount(component, {
  propsData,
  global: {plugins: [Quasar]}
});

import CInputTag from "@/components/c-input-tag.vue";
describe.each([
  ["ラベル", "ラベル"],
  ["ラベル2", "ラベル2"],
])("c-input-tag label", (label, expected) => {
  test(`tobe ${expected}`, () => {
    const w = mountWrapper(CInputTag, {
      modelValue: "input",
      label,
      options: ["よみたい"]
    });
    expect(w.find(".q-field__label").text()).toBe(expected);
  });
});
describe.each([
  ["ヒント", "ヒント"],
  ["ヒント2", "ヒント2"],
])("c-input-tag hint", (hint, expected) => {
  test(`tobe ${expected}`, () => {
    const w = mountWrapper(CInputTag, {
      modelValue: "input",
      hint,
      options: ["よみたい"]
    });
    expect(w.find(".q-field__messages div").text()).toBe(expected);
  });
});

import CRoundBtn from "@/components/c-round-btn.vue";
describe.each([
  ["icon1", "icon1"],
  ["icon2", "icon2"],
])("c-round-btn icon", (icon, expected) => {
  test(`tobe ${expected}`, () => {
    const w = mountWrapper(CRoundBtn, {
      icon,
    });
    expect(w.find("i.q-icon").text()).toBe(expected);
  });
});
describe.each([
  ["primary"],
  ["secondary"],
  ["negative"]
])("c-round-btn color", (color) => {
  test(`exist btn text-${color}`, () => {
    const w = mountWrapper(CRoundBtn, {
      icon: "icon", color
    });
    expect(w.find(`.q-btn.text-${color} i.q-icon`).text()).toBe("icon");
  });
});

// TODO: c-pagination

// TODO: c-header

// TODO: c-dialog

// TODO: c-confirm-dialog

// TODO: c-books-search-dialog