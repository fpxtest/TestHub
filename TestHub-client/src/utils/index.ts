import { OSType, ThemeType } from '@/constants';
import lodash, { isEqual } from 'lodash';
import { getModel, removeCurrentProject, removeSatoken, removeUserInfo, setSatoken } from './localStorage';

export function getOsTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? ThemeType.Dark
    : ThemeType.Light;
}


export function findDifferentProperties(obj1, obj2) {
  const differentProperties = {};

  // 遍历 obj1 中的属性
  for (let key in obj1) {
    // 如果 obj2 中也有相同的属性
    if (key in obj2) {
      // 比较属性值是否相等
      if (!isEqual(obj1[key], obj2[key])) {
        // 如果属性值不相等，则记录下这个属性及对应的值
        differentProperties[key] = { oldValue: obj1[key], newValue: obj2[key] };
      }
    } else {
      differentProperties[key] = { oldValue: obj1[key] }
    }
  }

  return differentProperties;
}
export function deepClone(target: any) {
  const map = new WeakMap();

  function isObject(_target: any) {
    return (typeof _target === 'object' && _target) || typeof _target === 'function';
  }

  function clone(data: any) {
    if (!isObject(data)) {
      return data;
    }
    if ([Date, RegExp].includes(data.constructor)) {
      return new data.constructor(data);
    }
    if (typeof data === 'function') {
      return new Function('return ' + data.toString())();
    }
    const exist = map.get(data);
    if (exist) {
      return exist;
    }
    if (data instanceof Map) {
      const result = new Map();
      map.set(data, result);
      data.forEach((val, key) => {
        if (isObject(val)) {
          result.set(key, clone(val));
        } else {
          result.set(key, val);
        }
      });
      return result;
    }
    if (data instanceof Set) {
      const result = new Set();
      map.set(data, result);
      data.forEach((val) => {
        if (isObject(val)) {
          result.add(clone(val));
        } else {
          result.add(val);
        }
      });
      return result;
    }
    const keys = Reflect.ownKeys(data);
    const allDesc = Object.getOwnPropertyDescriptors(data);
    const result = Object.create(Object.getPrototypeOf(data), allDesc);
    map.set(data, result);
    keys.forEach((key) => {
      const val = data[key];
      if (isObject(val)) {
        result[key] = clone(val);
      } else {
        result[key] = val;
      }
    });
    return result;
  }

  return clone(target);
}

// 获取var变量的值
export const callVar = (css: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(css).trim();
};

export const getThisModel = () => {
  return __UMI_ENV__ == 'desktop' ? getModel() || 'local' : 'server'
}
// 给我一个 obj[]， 和 obj的 key 和 value，给你返index
export function findObjListValue<T, K extends keyof T>(list: T[], key: K, value: any) {
  let flag = -1;
  list.forEach((t: T, index) => {
    Object.keys(t).forEach((j: K) => {
      if (j === key && t[j] === value) {
        flag = index;
      }
    });
  });
  return flag;
}
export function getCurrentroject() {
  const rightHash = location.hash.split('?')[1]
  const params: any = {}
  if (rightHash) {
    const arr = rightHash.split('&')
    arr.map(item => {
      const splitRes = item.split('=')
      params[splitRes[0]] = splitRes[1]
    })
  }
  return params
}

export function loginOut() {
  removeUserInfo();
  removeSatoken();
  removeCurrentProject();
}

/*
* 获取参数 
* @returns 
*/
export function getLocationHash() {
  const rightHash = location.hash.split('?')[1]
  const params: any = {}
  if (rightHash) {
    const arr = rightHash.split('&')
    arr.map(item => {
      const splitRes = item.split('=')
      params[splitRes[0]] = splitRes[1]
    })
  }
  return params
}

// 清理就版本不兼容的LocalStorage
export function clearOlderLocalStorage() {
  if (localStorage.getItem('app-local-storage-versions') !== 'v4') {
    localStorage.clear();
    localStorage.setItem('app-local-storage-versions', 'v4');
  }
}

// 退出登录清理一些记录位置的localStorage
export function logoutClearSomeLocalStorage() {
  setSatoken("");
  localStorage.removeItem('current-workspace-database');
  localStorage.removeItem('cur-connection');
  localStorage.removeItem('active-console-id');
  localStorage.removeItem('curPage');
}

// 判断是否需要更新版本
export function isVersionHigher(version: string, currentVersion: string): boolean {
  // 按照 . 分割版本号
  const versionParts = version.split('.');
  const currentVersionParts = currentVersion.split('.');

  // 按照从左到右的顺序比较每一位的大小
  for (let i = 0; i < versionParts.length; i++) {
    const part = parseInt(versionParts[i]);
    const currentPart = parseInt(currentVersionParts[i] || '0');

    if (part > currentPart) {
      return true;
    } else if (part < currentPart) {
      return false;
    }
  }

  // 如果两个版本号完全相等，则返回false
  return false;
}

// 获取应用的一些基本信息
export function getApplicationMessage() {
  const env = __ENV__;
  const versions = __APP_VERSION__;
  const buildTime = __BUILD_TIME__;
  const userAgent = navigator.userAgent;
  return {
    env,
    versions,
    buildTime,
    userAgent,
  };
}
// os is mac or windows
export const getOS = function (): OSType {
  var agent = navigator.userAgent.toLowerCase();
  var isMac = /macintosh|mac os x/i.test(navigator.userAgent);
  if (agent.indexOf("win32") >= 0 || agent.indexOf("wow32") >= 0 || agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) {
    return OSType.WIN
  } else if (isMac) {
    return OSType.MAC
  } else {
    return OSType.RESTS
  }
}()

// os is mac or windows
export function osNow(): {
  isMac: boolean;
  isWin: boolean;
} {
  const agent = navigator.userAgent.toLowerCase();
  const isMac = /macintosh|mac os x/i.test(navigator.userAgent);
  const isWin =
    agent.indexOf('win32') >= 0 ||
    agent.indexOf('wow32') >= 0 ||
    agent.indexOf('win64') >= 0 ||
    agent.indexOf('wow64') >= 0;
  return {
    isMac,
    isWin,
  };
}

// 桌面端用hash模式，web端用history模式，路由跳转
export function navigate(path: string) {
  if (__ENV__ === 'desktop') {
    window.location.replace(`#${path}`);
  } else {
    window.location.replace(path);
  }
}

// 获取cookie
export function getCookie(name: string) {
  const arr = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)(;|$)'));
  if (arr != null) {
    return decodeURIComponent(arr[2]);
  }
  return null;
}

// 判断两个版本的大小
export function compareVersion(version1: string, version2: string) {
  const v1 = version1.split('.');
  const v2 = version2.split('.');
  const len = Math.max(v1.length, v2.length);

  while (v1.length < len) {
    v1.push('0');
  }
  while (v2.length < len) {
    v2.push('0');
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i]);
    const num2 = parseInt(v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}

// 把剪切板的内容转成二维数组
export function clipboardToArray(text: string): Array<Array<string | null>> {
  if (!text) {
    return [[]];
  }
  try {
    const rows = text.split('\n');
    const array2D = rows.map((row) => row.split('\t'));
    return array2D;
  } catch {
    console.log('copy error');
    return [[]];
  }
}

// Copy
export function copy(message: string) {
  // clipboardCopy(message);
  navigator.clipboard.writeText(message);
}

// 二维数组复制
export function tableCopy(array2D: Array<Array<string | null>>) {
  try {
    const text = array2D.map((row) => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
  } catch {
    console.log('copy error');
  }
}
