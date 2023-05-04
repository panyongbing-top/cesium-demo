import * as Cesium from 'cesium'

/** 使用该工具包时，只需在创建Cesium Viewer之后，用以下代码实例化即可：
 * const viewer = new Cesium.Viewer("cesiumContainer");
 * const rectangleTool = new CesiumRectangleTool(viewer);
 * 然后在需要使用此工具时，可以调用 startDrawing 方法开始绘制矩形，调用 stopDrawing 方法停止绘制，调用 clear 方法清除绘制结果。
 *   **/
// 矩形
class CesiumRectangleTool {
  constructor(viewer, options = {}) {
    this.viewer = viewer
    this.options = {
      ...CesiumRectangleTool.DEFAULT_OPTIONS,
      ...(options || {}),
    }
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    this.drawing = true
    this.rectangle = null
    this.rectangleOutline = null
    this.points = []
    this.pointList = []
    this.initEventListeners()
  }
  static DEFAULT_OPTIONS = {
    fillColor: Cesium.Color.BLUE.withAlpha(0.2),
    outlineColor: Cesium.Color.BLUE,
  }

  initEventListeners() {
    const { scene } = this.viewer
    const { fillColor, outlineColor } = this.options
    this.handler.setInputAction((event) => {
      if (this.drawing) {
        // const earthPosition = scene.pickPosition(event.position);
        const ray = this.viewer.camera.getPickRay(event.position)
        const earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene)
        if (!Cesium.defined(earthPosition)) {
          return
        }
        const point = new Cesium.Entity({
          position: earthPosition,
          point: { pixelSize: 5, color: Cesium.Color.BLUE.withAlpha(1) },
        })
        this.pointList.push(point)
        this.viewer.entities.add(point)
        this.points.push(earthPosition)
        if (this.points.length === 1) {
          this.rectangleOutline = new Cesium.Entity({
            polyline: {
              positions: new Cesium.CallbackProperty(() => {
                return [this.points[0], this.points[0]]
              }, false),
              width: 2,
              material: outlineColor,
              arcType: 'RHUMB', //绘制方式
              // 虚线
              // material: new Cesium.PolylineDashMaterialProperty({
              //   color: outlineColor,
              //   dashLength: 10
              // }),
              height: 0,
            },
          })
          this.viewer.entities.add(this.rectangleOutline)
        } else if (this.points.length === 2) {
          this.viewer.entities.remove(this.rectangleOutline)
          this.pointList.map((item) => {
            this.viewer.entities.remove(item)
          })
          const rect = Cesium.Rectangle.fromCartesianArray(this.points)
          this.rectangle = new Cesium.Entity({
            rectangle: {
              coordinates: rect,
              outline: true,
              outlineWidth: 20,
              outlineColor,
              material: fillColor,
              height: 0,
            },
          })
          this.viewer.entities.add(this.rectangle)
          /* 直接生成矩形使用 */
          // this.rectangle.rectangle.coordinates = rect
          /* 清空 */
          this.pointList = []
          this.points = []
          this.rectangle = null
          // this.drawing = false;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.handler.setInputAction((event) => {
      if (this.drawing) {
        if (this.points.length === 0) {
          // 没有开始绘制，则不作处理
          return
        }
        // const earthPosition = scene.pickPosition(event.endPosition);
        const ray = this.viewer.camera.getPickRay(event.endPosition)
        const earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene)
        if (!Cesium.defined(earthPosition)) {
          return
        }
        const rect = Cesium.Rectangle.fromCartesianArray([this.points[0], earthPosition])
        console.log(this.rectangle)

        /* 直接生成 矩形 但是渲染很慢 */
        // if (this.rectangle) {
        //   this.rectangle.rectangle.coordinates = rect
        // } else {
        //   this.rectangle = new Cesium.Entity({
        //     rectangle: {
        //       coordinates: rect,
        //       outline: true,
        //       outlineWidth: 20,
        //       outlineColor,
        //       material: fillColor,
        //       height: 0,
        //     },
        //   })
        //   this.viewer.entities.add(this.rectangle)
        // }

        if (this.rectangleOutline) {
          this.rectangleOutline.polyline.positions = new Cesium.CallbackProperty(() => {
            // 转经纬度
            const northwest = Cesium.Rectangle.northwest(rect)
            const southwest = Cesium.Rectangle.southwest(rect)
            const northeast = Cesium.Rectangle.northeast(rect)
            const southeast = Cesium.Rectangle.southeast(rect)
            // 经纬度转世界坐标
            let southwestCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(southwest)
            let northwestCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(northwest)
            let southeastCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(southeast)
            let northeastCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(northeast)
            return [southwestCartesian, northwestCartesian, northeastCartesian, southeastCartesian, southwestCartesian]
          }, false)
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }
  startDrawing() {
    if (!this.drawing) {
      this.drawing = true
      this.clear()
    }
  }
  stopDrawing() {
    this.drawing = false
    this.clear()
  }
  clear() {
    this.viewer.entities.removeAll()
    this.points = []
    this.pointList = []
    this.rectangle = null
    this.rectangleOutline = null
  }
}

// 多边形
class CesiumPolygonTool {
  constructor(viewer, options = {}) {
    this.viewer = viewer
    this.options = {
      ...CesiumRectangleTool.DEFAULT_OPTIONS,
      ...(options || {}),
    }
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    this.drawing = true
    this.rectangle = null
    this.points = []
    this.pointList = []
    this.polylines = []
    this.polyline = null
    this.initEventListeners()
    this.moveLine = null
  }

  // 创建绘制线的函数
  createPolyline(points) {
    // 创建多边形的边
    for (let i = 0; i < this.points.length - 1; i++) {
      let polyline = new Cesium.Polyline({
        positions: [this.points[i], this.points[i + 1]],
        width: 2,
        material: Cesium.Color.WHITE,
      })
      this.polylines.add(polyline)
    }
    // 创建多边形的填充
    // var paintedPositions = makePaintedPositions(points)
    // var polylineFill = new Cesium.Polyline({
    //   positions: paintedPositions,
    //   width: 4,
    //   material: new Cesium.PolylineOutlineMaterialProperty({
    //     color: Cesium.Color.WHITE,
    //     outlineWidth: 1,
    //     outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
    //   }),
    // })
    // polylinesFill.add(polylineFill)
  }

  // 画
  draw(type) {}

  initEventListeners() {
    this.handler.setInputAction((event) => {
      // if (this.drawing) {
      // const earthPosition = scene.pickPosition(event.position);
      const ray = this.viewer.camera.getPickRay(event.position)
      const earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene)

      if (!Cesium.defined(earthPosition)) {
        return
      }
      console.log(earthPosition)
      const point = new Cesium.Entity({
        position: earthPosition,
        point: { pixelSize: 5, color: Cesium.Color.BLUE.withAlpha(1) },
      })
      this.points.push(earthPosition)
      this.viewer.entities.add(point)
      this.pointList.push(point)
      if (this.points.length === 1) {
        this.moveLine = new Cesium.Entity({
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              return [this.points[0], this.points[0]]
            }, false),
            width: 2,
            material: Cesium.Color.WHITE,
            height: 0,
          },
        })
        this.viewer.entities.add(this.moveLine)
      }
      if (this.points.length >= 2) {
        let previousPoint = this.points[this.points.length - 2]
        let lastPoint = this.points[this.points.length - 1]
        let polyline = new Cesium.Entity({
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              return [previousPoint, lastPoint]
            }, false),
            width: 2,
            material: Cesium.Color.WHITE,
            height: 0,
          },
        })
        console.log(polyline)
        this.viewer.entities.add(polyline)
        this.polylines.push(polyline)
        console.log(this.polylines)
      }
      // if (this.points.length > 2) {
      //   this.polyline.polyline.positions = this.points
      // }
      console.log(this.points)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.handler.setInputAction((event) => {
      // if (this.drawing) {
      const ray = this.viewer.camera.getPickRay(event.endPosition)
      const earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene)
      if (!Cesium.defined(earthPosition)) {
        return
      }
      this.moveLine.polyline.positions = new Cesium.CallbackProperty(() => {
        return [this.points[this.points.length - 1], earthPosition]
      }, false)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    this.handler.setInputAction((event) => {
      const ray = this.viewer.camera.getPickRay(event.position)
      const earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene)
      if (!Cesium.defined(earthPosition)) {
        return
      }
      if (this.points.length < 3) {
        return false
      }
      let polygon = new Cesium.Entity({
        // positions: this.points,
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(this.points),
          material: Cesium.Color.YELLOW.withAlpha(0.6),
          classificationType: Cesium.ClassificationType.BOTH,
          height: 0,
          outline: true,
          outlineColor: Cesium.Color.WHEAT.withAlpha(0.6),
          outlineWidth: 50,
        },
      })
      this.viewer.entities.add(polygon)
      this.clear()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  clear() {
    this.points = []
    this.pointList.map((item) => {
      this.viewer.entities.remove(item)
    })
    this.pointList = []
    this.polylines.map((item) => {
      this.viewer.entities.remove(item)
    })
    this.polylines = []
    this.viewer.entities.remove(this.moveLine)
    this.moveLine = null
  }
}

class deletePolygonTool {
  constructor(viewer, options = {}) {
    this.viewer = viewer
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    this.initEventListeners()
  }

  initEventListeners() {
    // 通过穿透拾取所有对象信息
    this.handler.setInputAction((event) => {
      let pickedObjectArrays = this.viewer.scene.drillPick(event.position, 5) //最多获取前5个对象// pickedObjectArrays 是个数组，使用for循环 可以拿到所有entity
      if (pickedObjectArrays.length > 0) {
        this.viewer.entities.remove(pickedObjectArrays[0].id)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }
}

export default deletePolygonTool
