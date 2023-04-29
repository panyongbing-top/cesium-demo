import * as Cesium from 'cesium';

/** 使用该工具包时，只需在创建Cesium Viewer之后，用以下代码实例化即可：
 * const viewer = new Cesium.Viewer("cesiumContainer");
 * const rectangleTool = new CesiumRectangleTool(viewer);
 * 然后在需要使用此工具时，可以调用 startDrawing 方法开始绘制矩形，调用 stopDrawing 方法停止绘制，调用 clear 方法清除绘制结果。
 *   **/
class CesiumRectangleTool {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = {
      ...CesiumRectangleTool.DEFAULT_OPTIONS,
      ...(options || {}),
    };
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.drawing = true;
    this.rectangle = null;
    this.rectangleOutline = null;
    this.points = [];
    this.pointList = []
    this.initEventListeners();
  }
  static DEFAULT_OPTIONS = {
    fillColor: Cesium.Color.BLUE.withAlpha(0.2),
    outlineColor: Cesium.Color.BLUE,
  };
  initEventListeners() {
    const { scene } = this.viewer;
    const { fillColor, outlineColor } = this.options;
    this.handler.setInputAction((event) => {
      if(this.drawing){
        // const earthPosition = scene.pickPosition(event.position);
        const ray = this.viewer.camera.getPickRay(event.position);
        const earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        if (!Cesium.defined(earthPosition)) {
          return;
        }
        const point = new Cesium.Entity({
          position: earthPosition,
          point: { pixelSize: 5, color:  Cesium.Color.BLUE.withAlpha(1) },
        });
        this.pointList.push(point)
        this.viewer.entities.add(point);
        this.points.push(earthPosition);
        console.log(2222)
        console.log(this.points)
        if (this.points.length === 1) {
          this.rectangleOutline = new Cesium.Entity({
            polyline: {
              positions: new Cesium.CallbackProperty(() => {
                return [this.points[0], this.points[0]];
              }, false),
              width: 2,
              material: outlineColor,
              // 虚线
              // material: new Cesium.PolylineDashMaterialProperty({
              //   color: outlineColor,
              //   dashLength: 10
              // }),
              height:0
            },
          });
          this.viewer.entities.add(this.rectangleOutline);
        } else if (this.points.length === 2) {
          this.viewer.entities.remove(this.rectangleOutline);
          this.pointList.map((item)=>{
            this.viewer.entities.remove(item);
          })
    
          const rect = Cesium.Rectangle.fromCartesianArray(this.points);
        
          console.log(this.points)
          console.log(rect)
          /* 先生成框，等第二个点出现后再生成矩形 */
          this.rectangle = new Cesium.Entity({
            rectangle: {
              coordinates: rect,
              outline: true,
              outlineWidth: 20,
              outlineColor,
              material: fillColor,
              height:0
            },
          });
          this.viewer.entities.add(this.rectangle);
          /* 直接生成矩形使用 */
          // this.rectangle.rectangle.coordinates = rect
          /* 清空 */
          this.pointList = []
          this.points = [];
          this.rectangle = null
          // this.drawing = false;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.setInputAction((event) => {
      if(this.drawing){
        if (this.points.length === 0) {
          // 没有开始绘制，则不作处理
          return;
        }
        // const earthPosition = scene.pickPosition(event.endPosition);
        const ray = this.viewer.camera.getPickRay(event.endPosition);
        const earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        if (!Cesium.defined(earthPosition)) {
          return;
        }
        const rect = Cesium.Rectangle.fromCartesianArray([
          this.points[0],
          earthPosition,
        ]);
        console.log(this.rectangle)

        /* 直接生成 矩形 但是渲染很慢 */
        // if(this.rectangle){
        //   this.rectangle.rectangle.coordinates = rect
        // }else{
        //   this.rectangle = new Cesium.Entity({
        //     rectangle: {
        //       coordinates: rect,
        //       outline: true,
        //       outlineWidth: 20,
        //       outlineColor,
        //       material: fillColor,
        //       height:0
        //     },
        //   });
        //   this.viewer.entities.add(this.rectangle);
        // }
        
        if (this.rectangleOutline) {
          this.rectangleOutline.polyline.positions = new Cesium.CallbackProperty(() => {
            // 转经纬度
            const northwest = Cesium.Rectangle.northwest(rect);
            const southwest = Cesium.Rectangle.southwest(rect);
            const northeast = Cesium.Rectangle.northeast(rect);
            const southeast = Cesium.Rectangle.southeast(rect);
            // 经纬度转世界坐标
            let southwestCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(southwest);
            let northwestCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(northwest);
            let southeastCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(southeast);
            let northeastCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(northeast);
            return [southwestCartesian,northwestCartesian,northeastCartesian,southeastCartesian,southwestCartesian]
          }, false);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
  startDrawing() {
    if (!this.drawing) {
      this.drawing = true;
      this.clear();
    }
  }
  stopDrawing() {
    this.drawing = false;
    this.clear();
  }
  clear() {
    this.viewer.entities.removeAll();
    this.points = [];
    this.pointList = []
    this.rectangle = null;
    this.rectangleOutline = null;
  }
}
export default CesiumRectangleTool;