import * as Cesium from 'cesium'

var polylines = new Cesium.PolylineCollection()
var polylinesFill = new Cesium.PolylineCollection()
var positions = []
// 创建绘制多边形的函数
function createPolygon(points) {
  // 创建多边形的边
  for (var i = 0; i < points.length - 1; i++) {
    var polyline = new Cesium.Polyline({
      positions: [points[i], points[i + 1]],
      width: 2,
      material: Cesium.Color.WHITE,
    })
    polylines.add(polyline)
  }
  // 创建多边形的填充
  var paintedPositions = makePaintedPositions(points)
  var polylineFill = new Cesium.Polyline({
    positions: paintedPositions,
    width: 4,
    material: new Cesium.PolylineOutlineMaterialProperty({
      color: Cesium.Color.WHITE,
      outlineWidth: 1,
      outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
    }),
  })
  polylinesFill.add(polylineFill)
}

// 生成多边形填充的顶点数组
function makePaintedPositions(points) {
  var len = points.length
  var paintedPositions = new Array(2 * len)
  for (var i = 0; i < len; i++) {
    paintedPositions[2 * i] = points[i]
    paintedPositions[2 * i + 1] = points[i]
  }
  paintedPositions[2 * len - 1] = points[0]
  return paintedPositions
}

// 开始画
export default function startDraw(viewer) {
  // 鼠标按下时的处理函数
  var mouseDownHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  mouseDownHandler.setInputAction(function (click) {
    var cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)
    if (!Cesium.defined(cartesian)) {
      return
    }
    positions.push(cartesian)
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN)
  // 鼠标移动时的处理函数
  var mouseMoveHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  mouseMoveHandler.setInputAction(function (movement) {
    var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid)
    if (!Cesium.defined(cartesian)) {
      return
    }
    var len = positions.length
    if (len < 2) {
      return
    }
    var nextPosition = cartesian
    if (len >= 3) {
      // polylines.removeAll()
      // 显示和填充多边形
      // createPolygon(positions)
    }
    // 显示鼠标拖动的直线
    var polyline = new Cesium.Polyline({
      positions: [positions[len - 1], nextPosition],
      width: 2,
      material: Cesium.Color.WHITE,
    })
    polylines.add(polyline)
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  // 鼠标双击时的处理函数
  var doubleClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  doubleClickHandler.setInputAction(function (click) {
    var cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)
    if (!Cesium.defined(cartesian)) {
      return
    }
    positions.push(cartesian)
    var len = positions.length
    if (len < 4) {
      alert('顶点数不能小于3')
      return
    }
    // 移除鼠标拖动的直线
    polylines.removeAll()
    // 显示和填充多边形
    createPolygon(positions)
    // 移除鼠标双击事件
    doubleClickHandler.destroy()
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
}
