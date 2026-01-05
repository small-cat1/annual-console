import request from '@/utils/request'

/**
 * 获取活动详情
 */
export function getActivityDetail(activityId) {
  return request.get(`/console/activity/${activityId}`)
}
