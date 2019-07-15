function array() {
  const self = []
  self.push.apply(self, arguments)
  self.__proto__ = array.prototype
  return self
}

array.prototype = new Array()

Object.defineProperty(array.prototype, 'back', {
  get: function() {
    return this[this.length - 1]
  }
})

export default array
