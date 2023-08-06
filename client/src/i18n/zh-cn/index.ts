import layouts from './layouts';
import setting from './setting';
import caseI18n from './caseI18n';
import pluginZhCn from '@/components/testHub/plugins/plugin-zh-cn';
import testhub from './testhub';
import app from './app';


export default {
  lang: 'zh-cn',
  ...app,
  ...setting,
  ...layouts,
  ...caseI18n,
  ...pluginZhCn,
  ...testhub
};
