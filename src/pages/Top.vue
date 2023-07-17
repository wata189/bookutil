<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

interface Menu {
  name: string,
  to: string,
  icon: string,
  description: string
};
interface Props {
  menus: Array<Menu>
};
const props = defineProps<Props>();

</script>

<template>
  <div class="row justify-center">
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <div v-for="menu in props.menus" class="q-pa-md">
        <q-card class="card-menu" @click="router.push(menu.to)">
          <q-card-section>
            <div class="text-h6">
              <q-icon :name="menu.icon"></q-icon>
              {{ menu.name }}
            </div>
          </q-card-section>
          <q-separator inset />
          
          <q-card-section>
            {{ menu.description }}
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-menu{
  cursor: pointer;
}
</style>