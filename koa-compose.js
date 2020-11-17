

'use strict'

/**
 * Expose compositor.
 */
module.exports = compose                      // 对外暴露compose函数
/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose (middleware) {                           // compose函数需要传入一个中间件数组 [fn,fn,fn,fn]
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')              // 如果传入的不是数组，则抛出错误
  for (const fn of middleware) {                            // 遍历判断数组队列中有一项不为函数，则抛出错误
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }
  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

   // compose函数调用后，返回的是下面这个匿名函数
   // 第一次调用和最后一次调用的时候第二个参数next实际上是一个undefined，因为第一次调用和最后一次都并不需要传入next参数
   // 这个匿名函数返回一个promise
  return function (context, next) {
    let index = -1           //初始下标为-1
    return dispatch(0)
    function dispatch (i) {
      //这里的i 是标识 我即将要去执行哪一个中间件  而 index 是标识 我上一次执行的是哪一个中间件
      //当i<=index时意味着我即将要去执行我已经执行过的中间件，这是违背洋葱模型的本质的，这时将会报错为next函数被调用执行多次
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i          // 更换辨识
      let fn = middleware[i]           // 根据即将要执行的中间件标识从中间件数组中取出一个中间件函数
      // 当i已经是数组的length了，说明中间件函数都执行结束，执行结束后把fn设置为undefined
      // 问题：本来middleware[i]如果i为length的话取到的值已经是undefined了，为什么要重新给fn设置为undefined呢？
      if (i === middleware.length) fn = next      

      //如果中间件遍历到最后了。那么。此时return Promise.resolve()返回一个成功状态的promise
      //答案：为了在这里捕获到给这个函数的出口返回一个Promise对象
      if (!fn) return Promise.resolve()

      // try catch保证错误在Promise的情况下能够正常被捕获。

      // 没有错误时正常执行try当中的Promise.resolve函数，第一个参数传的是context，执行时的上下文
      // 第二个参数是一个next函数，递归调用dispatch函数，目的是执行下一个中间件函数
      // next函数在中间件函数调用后返回的是一个promise对象
      try {
        return Promise.resolve(fn(context, function next () {
          return dispatch(i + 1)
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}