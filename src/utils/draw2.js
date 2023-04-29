/**
 * 绘制缓冲区
 */
import * as turf from "@turf/turf";
import * as Cesium from "cesium";

const BUFFER_ID = "BUFFER_ID"; // 缓冲面
const POINT_ID = "POINT_ID"; // 点
const POLYLINE_ID = "POLYLINE_ID"; // 线
const POLYGON_ID = "POLYGON_ID"; // 面
const BUFFER_RADIUS_ID = "BUFFER_RADIUS_ID"; // 半径
const BUFFER_DATA_SOURCE = "BUFFER_DATA_SOURCE";

const typeList = {
  point: POINT_ID,
  line: POLYLINE_ID,
  area: POLYGON_ID
};

class BufferDraw {
  /**
   * @type {import('cesium').ScreenSpaceEventHandler}
   */
  #handler = null;
  params = {
    position: null,
    radius: null
  };

  /**
   * @param {import('cesium').Viewer} viewer
   */
  constructor(viewer, name = BUFFER_DATA_SOURCE) {
    this.viewer = viewer;
    this.t = Date.now();
    this.name = `${name}_${this.t}`;
    this.createDataSource(this.name);
  }

  createDataSource(name) {
    let dataSource = this.viewer.dataSources.getByName(name)?.[0];
    if (!Cesium.defined(dataSource)) {
      dataSource = new Cesium.CustomDataSource(name);
      this.viewer.dataSources.add(dataSource);
    }
    this.dataSource = dataSource;
    return this.dataSource;
  }

  getDataSource() {
    return this.dataSource;
  }

  /**
   * 设置参数
   */
  setParams({ position, radius }) {
    this.params = {
      position: position ?? this.params.position,
      radius: radius ?? this.params.radius
    };
  }

  /**
   * 获取结果
   */
  getResult() {
    const type = this.getType();
    if (type === "other") return null;
    const positionString = this.getPositionString(this.params.position, type);
    return { ...this.params, positionString, type };
  }

  /**
   * 销毁
   */
  destroy() {
    this.destroyDataSource();
    this.destroyHandle();
  }

  destroyDataSource() {
    if (this.viewer && this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource);
    }
  }

  destroyHandle() {
    if (
      this.#handler &&
      this.#handler instanceof Cesium.ScreenSpaceEventHandler
    ) {
      this.#handler.destroy();
      this.#handler = null;
    }
  }

  getType() {
    if (this.findEntityById(typeList.point)) return "point";
    if (this.findEntityById(typeList.line)) return "line";
    if (this.findEntityById(typeList.area)) return "area";
    return "other";
  }

  getPositionString(position, type) {
    if (type === "point") {
      return `POINT(${position[0]} ${position[1]})`;
    }
    if (type === "line") {
      return `LINESTRING(${position.map(v => v.join(" ")).join(",")})`;
    }
    if (type === "area") {
      return `POLYGON((${position.map(v => v.join(" ")).join(",")}))`;
    }
  }

  getBuffered(point, radius, units = "meters") {
    return turf.buffer(point, radius, { units });
  }

  getDegreesArray(point, radius) {
    const buffered = this.getBuffered(point, radius);
    const coordinates = buffered.geometry.coordinates;
    const points = coordinates[0];
    const degreesArray = this.pointsToDegreesArray(points);
    return degreesArray;
  }

  findEntityById(id) {
    if (this.dataSource) {
      return this.dataSource.entities.getById(id);
    }
    return null;
  }

  // 格式转换
  pointsToDegreesArray(points) {
    const degreesArray = [];
    points.map(item => {
      degreesArray.push(item[0]);
      degreesArray.push(item[1]);
    });
    return degreesArray;
  }

  // 笛卡尔坐标转世界坐标
  getWGS84ByCartesian3(cartesian3) {
    const ellipsoid = this.viewer.scene.globe.ellipsoid;
    const cartographic = ellipsoid.cartesianToCartographic(cartesian3);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);
    const alt = cartographic.height;
    return { lat, lng, alt };
  }

  getCartesian3ByScreen(position) {
    const ray = this.viewer.camera.getPickRay(position);
    const cartesian3 = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    return cartesian3;
  }

  getWGS84ByScreen(position) {
    const cartesian3 = this.getCartesian3ByScreen(position);
    return this.getWGS84ByCartesian3(cartesian3);
  }

  // 初始化点缓冲
  initPointBuffer(positions, radius) {
    this.setParams({ position: positions, radius });
    const point = positions;
    radius = radius * 1000;
    this.addPoint(point);
    const pointF = turf.point(point);
    const degreesArray = this.getDegreesArray(pointF, radius);
    this.addBufferPolygon(Cesium.Cartesian3.fromDegreesArray(degreesArray));
    const radiusArray = [point[0], point[1], degreesArray[0], degreesArray[1]];
    this.addRadius(radiusArray, radius);
  }

  // 初始化线缓冲
  initPolylineBuffer(positions, radius) {
    this.setParams({ position: positions, radius });
    const points = positions;
    radius = radius * 1000;
    // let degreesArray = this.pointsToDegreesArray(points);
    // this.addPolyline(Cesium.Cartesian3.fromDegreesArray(degreesArray))

    const polylineF = turf.lineString(points);
    const degreesArray = this.getDegreesArray(polylineF, radius);
    this.addBufferPolygon(Cesium.Cartesian3.fromDegreesArray(degreesArray));
  }

  // 初始化面缓冲
  initPolygonBuffer(positions, radius) {
    this.setParams({ position: positions, radius });
    const points = positions;
    radius = radius * 1000;
    // let degreesArray = this.pointsToDegreesArray(points);
    // this.addPolygon(Cesium.Cartesian3.fromDegreesArray(degreesArray))

    const polygonF = turf.polygon([points]);
    const degreesArray = this.getDegreesArray(polygonF, radius);
    this.addBufferPolygon(Cesium.Cartesian3.fromDegreesArray(degreesArray));
  }

  // 半径和Label
  addRadius(radiusArray, radius) {
    const ID = BUFFER_RADIUS_ID;
    const entity = this.findEntityById(ID);
    const point1 = turf.point([radiusArray[0], radiusArray[1]]);
    const point2 = turf.point([radiusArray[2], radiusArray[3]]);
    const midpoint = turf.midpoint(point1, point2);
    const minPoint = midpoint.geometry.coordinates;
    const position = Cesium.Cartesian3.fromDegrees(minPoint[0], minPoint[1]);
    const positions = Cesium.Cartesian3.fromDegreesArray(radiusArray);
    const labelText = radius / 1000 + "KM";
    if (entity) {
      entity.label.text = labelText;
      entity.position = position;
      entity.polyline.positions = positions;
      return;
    }
    this.dataSource.entities.add({
      id: ID,
      position,
      label: {
        text: labelText,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        fillColor: Cesium.Color.YELLOW,
        scale: 0.7,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      polyline: {
        positions,
        width: 3,
        clampToGround: true,
        material: Cesium.Color.YELLOW.withAlpha(0.7)
      }
    });
  }

  // 添加缓冲面
  addBufferPolygon(positions) {
    const ID = BUFFER_ID;
    const entity = this.findEntityById(ID);
    const hierarchy = new Cesium.PolygonHierarchy(positions);
    if (entity) {
      entity.polygon.hierarchy = hierarchy;
      entity.polyline.positions = positions;
      return;
    }
    this.dataSource.entities.add({
      id: ID,
      polygon: {
        hierarchy,
        // material: Cesium.Color.BLUE.withAlpha(0.3),
        material: Cesium.Color.BLUE.withAlpha(0.0),
        classificationType: Cesium.ClassificationType.BOTH,
        outline: true,
        outlineWidth:5,
        outlineColor: Cesium.Color.BLUE,
      },
      // polyline: {
      //   positions: positions,
      //   width: 3,
      //   clampToGround: true,
      //   material: Cesium.Color.YELLOW.withAlpha(0.7)
      // }
    });
  }

  removeBufferPolygon() {
    const dataSource = this.dataSource;
    if (dataSource.entities.getById(BUFFER_ID)) {
      dataSource.entities.removeById(BUFFER_ID);
    }
    if (dataSource.entities.getById(BUFFER_RADIUS_ID)) {
      dataSource.entities.removeById(BUFFER_RADIUS_ID);
    }
  }

  // 添加点
  addPoint(point) {
    const ID = POINT_ID;
    const entity = this.findEntityById(ID);
    const position = Cesium.Cartesian3.fromDegrees(point[0], point[1], 0);
    if (entity) {
      entity.position = position;
      return;
    }
    return this.dataSource.entities.add({
      id: ID,
      position,
      point: {
        pixelSize: 10,
        outlineWidth: 3,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.RED.withAlpha(0.4),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
  }

  // 添加线
  addPolyline(positions) {
    return this.dataSource.entities.add({
      id: POLYLINE_ID,
      polyline: {
        positions,
        width: 2,
        clampToGround: true,
        material: Cesium.Color.YELLOW
      }
    });
  }

  // 添加面
  addPolygon(positions) {
    return this.dataSource.entities.add({
      id: POLYGON_ID,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        material: Cesium.Color.YELLOW.withAlpha(0.6),
        classificationType: Cesium.ClassificationType.BOTH
      },
      polyline: {
        positions: positions,
        width: 2,
        material: Cesium.Color.YELLOW.withAlpha(0.4)
      }
    });
  }

  /**
   * 过滤
   * @param {string} type
   */
  filterDraw(type) {
    const list = ["point", "line", "area"];
    const delList = list.filter(v => v !== type);

    delList.forEach(v => {
      const id = typeList[v];
      this.dataSource.entities.removeById(id);
    });
  }

  createHandler() {
    const handler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    );
    return handler;
  }

  // 绘制点
  drawPoint(cb) {
    this.#handler = this.createHandler();
    this.#handler.setInputAction(movement => {
      const earthPosition = this.viewer.scene.pickPosition(movement.endPosition);
      if (!Cesium.defined(earthPosition)) {
        return;
      }
      this.filterDraw("point");
      this.removeBufferPolygon();
      const WGS84 = this.getWGS84ByScreen(movement.position);
      const position = [WGS84.lng, WGS84.lat];
      this.initPointBuffer(position, this.params.radius);
      console.log(1111)
      cb && cb();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  // 绘制线
  drawLine(cb) {
    const ID = POLYLINE_ID;
    let entity = this.findEntityById(ID);
    let positions = [];
    this.#handler = this.createHandler();

    this.#handler.setInputAction(movement => {
      const earthPosition = this.viewer.scene.pickPosition(movement.endPosition);
      if (!Cesium.defined(earthPosition)) {
        return;
      }
      this.filterDraw("line");
      this.removeBufferPolygon();
      if (!positions.length && entity) {
        this.dataSource.entities.remove(entity);
        entity = null;
      }
      const cartesian3 = this.getCartesian3ByScreen(movement.position);
      !positions.length && positions.push(cartesian3);
      positions.push(cartesian3);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.#handler.setInputAction(movement => {
      const earthPosition = this.viewer.scene.pickPosition(movement.endPosition);
      if (!Cesium.defined(earthPosition)) {
        return;
      }
      if (positions.length > 0) {
        const movePosition = this.getCartesian3ByScreen(movement.startPosition);
        if (positions.length >= 2) {
          // tool.showAt(movement1.endPosition, '<p>左键点击确定折线中间点</p><p>右键单击结束绘制</p>');
          if (!entity) {
            entity = this.addPolyline(positions);
            this.updatePositions(entity, positions);
          } else {
            positions.pop();
            positions.push(movePosition);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.#handler.setInputAction((event) => {
      const earthPosition = this.viewer.scene.pickPosition(event.endPosition);
      if (!Cesium.defined(earthPosition)) {
        return;
      }
      positions.pop();
      if (entity && positions.length < 2) {
        this.dataSource.entities.remove(entity);
        this.setParams({ position: null });
      } else {
        const WGS84 = positions.map(v => {
          const item = this.getWGS84ByCartesian3(v);
          return [item.lng, item.lat];
        });
        this.initPolylineBuffer(WGS84, this.params.radius);
        cb && cb();
      }
      positions = [];
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  // 绘制面
  drawArea(cb) {
    const ID = POLYGON_ID;
    let entity = this.findEntityById(ID);
    let positions = [];
    let firstPoint;
    this.#handler = this.createHandler();

    // 鼠标左击触发
    this.#handler.setInputAction(movement => {
      const ray = this.viewer.camera.getPickRay(movement.position);
      const earthPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      console.log(Cesium.defined(earthPosition))
      if (!Cesium.defined(earthPosition)) {
        return;
      }
      this.filterDraw("area");
      this.removeBufferPolygon();
      if (!positions.length && entity) {
        this.dataSource.entities.remove(entity);
        entity = null;
      }
      const cartesian3 = this.getCartesian3ByScreen(movement.position);
      if (!positions.length) {
        firstPoint = cartesian3;
        positions.push(cartesian3);
      }
      positions.push(cartesian3);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动触发
    this.#handler.setInputAction(movement => {
      const ray = this.viewer.camera.getPickRay(movement.endPosition);
      const newPosition = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      if (!Cesium.defined(newPosition)) {
        return;
      }
      if (positions.length > 0) {
        const movePosition = this.getCartesian3ByScreen(movement.startPosition);
        if (positions.length >= 2) {
          // tool.showAt(movement1.endPosition, '<p>左键点击确定折线中间点</p><p>右键单击结束绘制</p>');
          if (!entity) {
            entity = this.addPolygon(positions);
            this.updatePositions(entity, positions);
          } else {
            positions.pop();
            positions.push(movePosition);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标右击触发
    this.#handler.setInputAction((event) => {
      // const earthPosition = this.viewer.scene.pickPosition(event.endPosition);
      // if (!Cesium.defined(earthPosition)) {
      //   return;
      // }
      positions.pop();
      if (entity && positions.length < 3) {
        this.dataSource.entities.remove(entity);
        this.setParams({ position: null });
      } else {
        positions.push(firstPoint);
        const WGS84 = positions.map(v => {
          const item = this.getWGS84ByCartesian3(v);
          return [item.lng, item.lat];
        });
        this.initPolygonBuffer(WGS84, this.params.radius);
        cb && cb();
      }
      positions = [];
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  // 实时更新位置
  updatePositions(entity, positions) {
    if (entity.polyline) {
      entity.polyline.positions = new Cesium.CallbackProperty(
        () => positions,
        false
      );
    }
    if (entity.polygon) {
      const hierarchy = new Cesium.PolygonHierarchy(positions);
      entity.polygon.hierarchy = new Cesium.CallbackProperty(
        () => hierarchy,
        false
      );
    }
  }

  /**
   *
   * @param {{position: array, radius: number}} params 参数
   * @param {function} cb 画完的回调函数
   */
  startDraw(params, cb) {
    this.destroyHandle();
    this.setParams({ radius: params.radius });
    switch (params.type) {
      case "point":
        this.drawPoint(cb);
        break;
      case "line":
        this.drawLine(cb);
        break;
      case "area":
        this.drawArea(cb);
        break;
      default:
        break;
    }
  }

  /**
   * 参数改变时重绘
   * @param {object} params
   */
  paramsChange(params) {
    const _params = this.params;
    const {
      type,
      radius = _params.radius,
      position = _params.position
    } = params;
    if (position === void 0 || position === null) return;
    if (radius === void 0 || radius === null) return;
    switch (type) {
      case "point":
        this.initPointBuffer(position, radius);
        break;
      case "line":
        this.initPolylineBuffer(position, radius);
        break;

      case "area":
        this.initPolygonBuffer(position, radius);
        break;
      default:
        break;
    }
  }
}
export default BufferDraw