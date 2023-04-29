import * as Cesium from 'cesium'
//自定义绘制图形，支持 点，线，面，矩形，圆，标识，可自定义绘制过程中的和绘制完的预览
function drawGraphic(view,_mode,_callback,_GraphicProperty){
  let {camera} = view
  let handler = null
  let activeShapePoints = null
  let activeShape = null
  let floatingPoint = null
  let boundaryPoints = []
  let returnGraphic = null
  //清空所有可能的监听和画到一半的图形
  if(handler){
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }
  if(activeShapePoints||activeShape||floatingPoint||boundaryPoints.length>0||returnGraphic){
      if(floatingPoint){
          view.entities.remove(floatingPoint);
          floatingPoint = undefined;
      }
      if(activeShape){
          view.entities.remove(activeShape);
          activeShape = undefined;
      }
      activeShapePoints = [];
      if(boundaryPoints.length>0){
          for(let i=0;i<boundaryPoints.length;i++){
              view.entities.remove(boundaryPoints[i]);
          }
      }
  }
 //配置
  var drawingMode = _mode;
  var GraphicProperty;
  if(_GraphicProperty===null||_GraphicProperty===""||_GraphicProperty===undefined){
      GraphicProperty = {}
  }else{
      GraphicProperty=_GraphicProperty
  }
  //监听左键点击事件
  function listenClick(_view,_callback) {
      handler = new Cesium.ScreenSpaceEventHandler(view.scene.canvas);
      handler.setInputAction(function(movement) {
          let position = view.scene.pickPosition(movement.position);
          let screenPosition = movement.position;
          let callbackObj = {};
          callbackObj.cartesian3=position;
          callbackObj.movement=movement;
          callbackObj.screenPosition=screenPosition;
          _callback(callbackObj,handler);
      },Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }
  //模式判断
  if(drawingMode==='point'){
      listenClick(view, function(callbackObj, handler) {
          let position = callbackObj.cartesian3;
          let Point;
          //构造实体
          if(GraphicProperty.style&&GraphicProperty.style.point){
              Point =  view.entities.add({
                  id:GraphicProperty.id||null,
                  description:GraphicProperty.description||'',
                  name:GraphicProperty.name||'',
                  position:position,
                  point:GraphicProperty.style.point
              });
          }else{
              Point =  view.entities.add({
                  type:'Selection tool',
                  position:position,
                  point:{
                      color:  Cesium.Color.WHITE,
                      pixelSize: 10,
                      outlineColor: Cesium.Color.BLACK,
                      outlineWidth:  0,
                      show:  true,
                  }
              });
          }
          //回调产生的点
          if(_callback){
              _callback(Point);
          }
          //销毁左键监听
          handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
          handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      });
  }
  else if(drawingMode==='marker'){
      if(GraphicProperty.style&&GraphicProperty.style.billboard){
          listenClick(_view, function(callbackObj, handler) {
              //此时场景中的点
              let position = callbackObj.cartesian3;
              //赋值，构造点实体Entity
              let  Marker =  view.entities.add({
                  id:GraphicProperty.id||null,
                  description:GraphicProperty.description||null,
                  name:GraphicProperty.name||'',
                  type:'Selection tool',
                  show:GraphicProperty.show||true,
                  position:position,
                  billboard:GraphicProperty.style.billboard
              });
              //回调构造的点
              if(_callback){
                  _callback(Marker);
              }
              //销毁
              handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
              handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
              handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
              handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          });
      }else{
          listenClick(_view, function(callbackObj, handler) {
              //此时场景中的点
              let position = callbackObj.cartesian3;
              //赋值，构造点实体Entity
              let  Marker =  view.entities.add({
                  type:'Selection tool',
                  show: true,
                  position:position,
                  point:{
                      color:  Cesium.Color.WHITE,
                      pixelSize: 10,
                      outlineColor: Cesium.Color.BLACK,
                      outlineWidth:  0,
                      show:  true,
                  }
              });
              //回调构造的点
              if(_callback){
                  _callback(Marker);
              }
              //销毁
              handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
              handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
              handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
              handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          });
      }
  }
  else{
      handler = new Cesium.ScreenSpaceEventHandler(view.canvas);
      //取消自带的双击放大监听
      view.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      //构造点，例如在活动的提示点
      function createPoint(worldPosition) {
          var point = view.entities.add({
              position : worldPosition,
              point : {
                  color : Cesium.Color.WHITE,
                  pixelSize : 5,
              }
          });
          return point;
      }
      //绘制图形
      function drawShape(positionData) {
          var shape;
          if (drawingMode === 'polyline') {
              if(GraphicProperty.style&&GraphicProperty.style.polyline){
                  GraphicProperty.style.polyline.positions=positionData;
                  shape = view.entities.add({
                      id:GraphicProperty.id||null,
                      name:GraphicProperty.name||'',
                      description:GraphicProperty.description||'',
                      polyline : GraphicProperty.style.polyline
                  });
              }else{
                  shape = view.entities.add({
                      polyline : {
                          positions : positionData,
                          width : 3
                      }
                  });
              }
          }
          else if (drawingMode === 'polygon') {
              if(GraphicProperty.style&&GraphicProperty.style.polygon){
                  GraphicProperty.style.polygon.hierarchy=positionData;
                  GraphicProperty.style.polygon.perPositionHeight=true;
                  shape = view.entities.add({
                      id:GraphicProperty.id||null,
                      name:GraphicProperty.name||'',
                      description:GraphicProperty.description||'',
                      polygon:GraphicProperty.style.polygon
                  });
              }else{
                  shape = view.entities.add({
                      polygon: {
                          hierarchy: positionData,
                          material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.7)),
                          perPositionHeight:true
                      }
                  });
              }
          }
          else if (drawingMode === 'circle'){
              //当positionData为数组时绘制最终图，如果为function则绘制动态图
              let xyz = new Cesium.Cartesian3(activeShapePoints[0].x, activeShapePoints[0].y, activeShapePoints[0].z);
              //转WGS84
              let wgs84 = view.scene.globe.ellipsoid.cartesianToCartographic(xyz);
              let height = wgs84.height;
              let value = typeof positionData.getValue === 'function' ? positionData.getValue(0) : positionData;
              if(GraphicProperty.style&&GraphicProperty.style.ellipse){
                  GraphicProperty.style.ellipse.semiMinorAxis=new Cesium.CallbackProperty(function () {
                      //半径 两点间距离
                      var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2));
                      return r ? r : r + 1;
                  }, false);
                  GraphicProperty.style.ellipse.semiMajorAxis=new Cesium.CallbackProperty(function () {
                      var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2));
                      return r ? r : r + 1;
                  }, false);
                  GraphicProperty.style.ellipse.height=height;
                  shape = view.entities.add({
                      position: activeShapePoints[0],
                      id:GraphicProperty.id||null,
                      name:GraphicProperty.name||'',
                      description:GraphicProperty.description||'',
                      ellipse:GraphicProperty.style.ellipse
                  });
              }
              else{
                  shape = view.entities.add({
                      position: activeShapePoints[0],
                      ellipse: {
                          semiMinorAxis: new Cesium.CallbackProperty(function () {
                              //半径 两点间距离
                              var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2));
                              return r ? r : r + 1;
                          }, false),
                          semiMajorAxis: new Cesium.CallbackProperty(function () {
                              var r = Math.sqrt(Math.pow(value[0].x - value[value.length - 1].x, 2) + Math.pow(value[0].y - value[value.length - 1].y, 2));
                              return r ? r : r + 1;
                          }, false),
                          material: GraphicProperty.material||Cesium.Color.BLUE.withAlpha(0.5),
                          height:height,
                          outline: true
                      }
                  });
              }
          }
          else if (drawingMode === 'rectangle'){
              let xyz = new Cesium.Cartesian3(activeShapePoints[0].x, activeShapePoints[0].y, activeShapePoints[0].z);
              //转WGS84
              let wgs84 = view.scene.globe.ellipsoid.cartesianToCartographic(xyz);
              let height = wgs84.height;
              //当positionData为数组时绘制最终图，如果为function则绘制动态图
              let arr = typeof positionData.getValue === 'function' ? positionData.getValue(0) : positionData;
              if(GraphicProperty.style&&GraphicProperty.style.rectangle){
                  GraphicProperty.style.rectangle.coordinates=new Cesium.CallbackProperty(function () {
                      return Cesium.Rectangle.fromCartesianArray(arr);
                  }, false);
                  GraphicProperty.style.rectangle.height=height;
                  shape = view.entities.add({
                      id:GraphicProperty.id||null,
                      name:GraphicProperty.name||'',
                      description:GraphicProperty.description||'',
                      rectangle : GraphicProperty.style.rectangle
                  });
              }else{
                  shape = view.entities.add({
                      rectangle : {
                          coordinates :  new Cesium.CallbackProperty(function () {
                              return Cesium.Rectangle.fromCartesianArray(arr);
                          }, false),
                          material : Cesium.Color.GREEN.withAlpha(0.5),
                          height:height
                      }
                  });
              }
          }
          return shape;
      }
      //左键监听，每一次绘制都要留下记录
      handler.setInputAction(function(event) {
        //在场景中使用深度拾取scene.pickPosition  globe的pick还有camera的pick在场景中拾取不准确
          var earthPosition = view.scene.pickPosition(event.position);
          //当鼠标不在地表时，earthPosition切成未定义undefined
          if (Cesium.defined(earthPosition)) {
              if (activeShapePoints.length === 0) {
                  floatingPoint = createPoint(earthPosition);
                  activeShapePoints.push(earthPosition);
                  var dynamicPositions = new Cesium.CallbackProperty(function () {
                      if (drawingMode === 'polygon') {
                          return new Cesium.PolygonHierarchy(activeShapePoints);
                      }
                      return activeShapePoints;
                  }, false);
                  activeShape = drawShape(dynamicPositions);
              }
              activeShapePoints.push(earthPosition);
              let boundaryPoint=createPoint(earthPosition);
              boundaryPoints.push(boundaryPoint);
          }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      //鼠标移动的监听
      handler.setInputAction(function(event) {
          if (Cesium.defined(floatingPoint)) {
              var newPosition = view.scene.pickPosition(event.endPosition);
              if (Cesium.defined(newPosition)) {
                  floatingPoint.position.setValue(newPosition);
                  activeShapePoints.pop();
                  activeShapePoints.push(newPosition);
              }
          }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      //重置图形，形成最终形态，把动态过程中的图形全部去掉
      function terminateShape() {
          activeShapePoints.pop();
          let final_Entity;
          if(activeShapePoints.length){
              final_Entity = drawShape(activeShapePoints);//绘制最终图
          }
          view.entities.remove(floatingPoint);
          view.entities.remove(activeShape);
          floatingPoint = undefined;
          activeShape = undefined;
          activeShapePoints = [];
          for(let i=0;i<boundaryPoints.length;i++){
              view.entities.remove(boundaryPoints[i]);
          }
          return final_Entity;
      }
      //右键监听，结束画图
      handler.setInputAction(function(event) {
          returnGraphic = terminateShape();
          if(_callback){
              _callback(returnGraphic);
          }
          handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
          handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }
};

//构造polygon属性
function constructPolygon(_param){
  if(!_param){
      _param={};
  }
  let PolygonlEntity = {};
  PolygonlEntity.polygon = {
      hierarchy: _param.hierarchy||null,
      show:_param.show||true,
      fill:_param.fill||true,
      outline: _param.outline || false,
      outlineWidth: _param.maximumHeights || null,
      outlineColor: _param.show || true,
      distanceDisplayCondition: _param.distanceDisplayCondition || undefined,
      material:_param.material||Cesium.Color.WHITE,
      perPositionHeight:_param.perPositionHeight||true    //这个属性是false时会始终贴在地表，不会变成空间性的面
  };
  return PolygonlEntity;
};

//构造polyline属性
function constructPolyline(_param) {
  if(!_param){
      _param={};
  }
  let PolylineEntity = {};
  PolylineEntity.polyline = {
      width: _param.width || 1.0,
      positions: _param.positions||null,
      show: _param.show || true,
      material: _param.material || Cesium.Color.WHITE,
      distanceDisplayCondition: _param.distanceDisplayCondition || undefined
  };
  return PolylineEntity;
};

//构造rectangle属性
function constructRectangle(_param) {
  if(!_param){
      _param={};
  }
  let RectangleEntity = {};
  RectangleEntity.rectangle = {
      coordinates: _param.coordinates||null,
      show: _param.show || true,
      fill: _param.fill || true,
      material: _param.material || Cesium.Color.WHITE,
      distanceDisplayCondition: _param.distanceDisplayCondition || undefined
  };
  return RectangleEntity;
};

//构造point属性
function constructPoint(_param) {
  let PointEntity = {};
  if (!_param) {
      _param = {}
  }
  PointEntity.point = {
      color: _param.color || Cesium.Color.WHITE,
      pixelSize: _param.pixelSize || 1,
      outlineColor: _param.outlineColor || Cesium.Color.BLACK,
      outlineWidth: _param.outlineWidth || 0,
      show: _param.show || true,
      scaleByDistance: _param.scaleByDistance || null,
      translucencyByDistance: _param.translucencyByDistance || null,
      heightReference: _param.heightReference || Cesium.HeightReference.NONE,
      distanceDisplayCondition: _param.distanceDisplayCondition || undefined,
  };
  return PointEntity;
};

//构造marker（billboard）属性
function constructBillboard(_param) {
  if(!_param){
      _param={};
  }
  let BillboardEntity = {};
  BillboardEntity.billboard = {
      image: _param.image||null,
      show: _param.show || true,
      scale: _param.scale || 1.0,
      eyeOffset: _param.eyeOffset || Cesium.Cartesian3.ZERO,
      pixelOffset: _param.pixelOffset || Cesium.Cartesian2.ZERO,
      // sizeInMeters:_param.sizeInMeters||true,
      horizontalOrigin: _param.horizontalOrigin || Cesium.HorizontalOrigin.CENTER, //水平方向  中心
      verticalOrigin: _param.verticalOrigin || Cesium.VerticalOrigin.CENTER, //垂直方向 底部
      rotation: _param.rotation || 0,
      heightReference: _param.heightReference || Cesium.HeightReference.NONE,
      distanceDisplayCondition:_param.distanceDisplayCondition ||undefined
      // pixelOffsetScaleByDistance:_param.pixelOffsetScaleByDistance
  };
  return BillboardEntity
};

//构造circle（ellipse）的属性
function constructEllipse(_param) {
  if(!_param){
      _param={};
  }
  let EllipseEntity = {};
  EllipseEntity.ellipse = {
      semiMinorAxis: _param.semiMinorAxis || 2000,
      semiMajorAxis: _param.semiMajorAxis || 2000,
      height: _param.height || 0,
      material: _param.material || Cesium.Color.WHITE,
  };
  return EllipseEntity;
};



let pointStyle = {
  style: constructPoint({
      color: Cesium.Color.RED,
      pixelSize: 10,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 0,
      show: true,
      // distanceDisplayCondition: camera.DistanceDisplayCondition(0.1, 2500.0)
  })
};

// let markerStyle = {
//   style: constructBillboard({
//       image: 'images/pic.png',
//       scale: 0.3,
//       verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
//       pixelOffset: coordinates.createCatesian2(0, -20),
//   })
// };

let rectangleStyle = {
  style: constructRectangle({
      // material:style.setColorWithAlpha(Cesium.Color.GREEN,0.5)
  })
};

// let circleStyle = {
//   style: constructEllipse({
//       material:style.setColorWithAlpha(Cesium.Color.DARKGOLDENROD,0.5)
//   })
// };

//绘制
let drawarr = [];
export default function draW(view,e) {
  let {camera} = view
  switch (e) {
      case 'point':
          drawGraphic(view,'point',function (_entity) {
              drawarr.push(_entity);
          },pointStyle);
          break;
      case 'polyline':
          drawGraphic(view,'polyline',function (_entity) {
              drawarr.push(_entity);
          },polylineStyle);
          break;
      case 'polygon':
          drawGraphic(view,'polygon',function (_entity) {
              drawarr.push(_entity);
          },polygonStyle);
          break;
      case 'marker':
          drawGraphic(view,'marker',function (_entity) {
              drawarr.push(_entity);
          },markerStyle);
          break;
      case 'circle':
          drawGraphic(view,'circle',function (_entity) {
              drawarr.push(_entity);
          },circleStyle);
          break;
      case 'rectangle':
          drawGraphic(view,'rectangle',function (_entity) {
              drawarr.push(_entity);
          },rectangleStyle);
          break;
  }
}
