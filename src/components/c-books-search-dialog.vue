<script setup lang="ts">

import { ComputedRef, Ref, computed, ref } from 'vue';

import googleBooksUtil from '@/modules/googleBooksUtil';

import CDialog from "@/components/c-dialog.vue";

const props = defineProps({
  modelValue: {type:Boolean, required: true},
  searchWord: {type:String, required: true}
});
const emits = defineEmits(["update:modelValue","ok"]);
const value = computed({
  get() {
    return props.modelValue
  },
  set(value){
    emits("update:modelValue", value)
  }
});

type GoogleBook = {
  bookName: string | undefined,
  isbn: string | undefined,
  authorName: string,
  page: number | undefined,
  coverUrl: string | undefined,
  description: string | undefined
};
const tableRows:Ref<GoogleBook[]> = ref([]);

const tableColumnInfos = [
  {
    name: "isbn",
    label: "ISBN",
    style: "width: 120px"
  },
  {
    name: "bookName",
    label: "書籍名",
    style: "max-width: 300px"
  },
  {
    name: "authorName",
    label: "著者名",
    style: "max-width: 120px"
  }
]
type TableColumn = { 
  name: string; 
  label: string; 
  field: string; 
  align?: "left" | "right" | "center" | undefined;
  sortable?: boolean | undefined; 
  style?: string | undefined; 
  headerStyle?: string | undefined; 
  classes?: string | undefined; 
}

const tableColumns:ComputedRef<TableColumn[]> = computed(() => {
  return tableColumnInfos.map((info) => {
    return {
      name: info.name,
      label: info.label,
      field: info.name,
      style: info.style,
      headerStyle: info.style,
      classes: "ellipsis",
      align: "left"
    };
  });
});
const searchBooks = async (searchWord:string) => {
  tableRows.value = await googleBooksUtil.searchBooks(searchWord);
};
const clickRow = (_evt:any, row:GoogleBook, _index:number) => {
  value.value = false;
  emits("ok", row);
};
</script>

<template>
  <c-dialog
    v-model="value"
    header-text="書籍検索"
    hide-footer
    @show="searchBooks(props.searchWord)"
    @hide="tableRows = []"
    class="books-search-dialog"
    no-padding
  >
    <q-table
      v-if="tableRows.length > 0"
      :rows="tableRows"
      :columns="tableColumns"
      row-key="name"
      dense
      hide-bottom
      :rows-per-page-options="[0]"
      @row-click="clickRow"
    >
      <template v-slot:body-cell="props">
        <q-td :props="props" :title="props.value">
          {{ props.value }}
        </q-td>
      </template>
    </q-table>
    <div v-else class="dialog-table">
      <!-- プレースホルダ -->
    </div>
  </c-dialog>
</template>

<style scoped>
.dialog-table{
  min-width: 540px;
  min-height: 312.5px;
}
</style>