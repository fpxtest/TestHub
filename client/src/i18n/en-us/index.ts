import caseI18n from './caseI18n';
import layouts from './layouts';
import setting from './setting';
import pluginEnUs from '@/components/testHub/plugins/plugin-en-us';
import testhub from './testhub';
import app from './app';

export default {
  lang: 'en',
  ...app,
  ...setting,
  ...layouts,
  ...caseI18n,
  ...pluginEnUs,
  ...testhub
};