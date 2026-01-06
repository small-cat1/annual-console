import request from '@/utils/request'

/**
 * 弹幕管理 API
 */

/**
 * 获取弹幕列表
 */
export function getDanmakuList(activityId, params = {}) {
  return request({
    url: '/console/danmaku/list',
    method: 'get',
    params: { activityId, ...params }
  })
}


