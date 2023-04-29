import React, { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { Viewer, Entity, PointGraphics, GeoJsonDataSource, Camera } from 'resium'
import 'cesium/Source/Widgets/widgets.css'
import CesiumEditPolygon from '@/utils/CesiumEditPolygon'
import { clickDawPolygon } from '@/utils/drawPolygon'
import draw from '@/utils/draw.js'
import draw2 from '@/utils/draw2.js'
import draw3 from '@/utils/draw3.js'
import draw4 from '@/utils/draw4.js'
import './style.scss'

// 自己的token
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5YTUxYzljOS01YzNhLTRlNWYtYjk4Ni04ODE5MWJjYTE3MDMiLCJpZCI6MTM1MTA4LCJpYXQiOjE2ODI0MDE5Nzd9.ypL-w7fygaLDGb522shxImEbBFgyEYEwEKiKroUV7nI'

export default function main() {
  const viewerRef = useRef(null)
  const geoJsonDataRef = useRef(null)
  const position = Cesium.Cartesian3.fromDegrees(116.435314, 40.960521, 10000000.0)
  const pointGraphics = { pixelSize: 10 }
  let editPolygonTools = null
  let polygon_height = null

  useEffect(() => {
    // 定位到position
    viewerRef.current.cesiumElement.camera.flyTo({
      destination: position,
      duration: 2,
    })
    draw4(viewerRef.current.cesiumElement)
    console.log(viewerRef.current.cesiumElement)
    // editPolygonTools = new CesiumEditPolygon(viewerRef.current.cesiumElement)
    // editPolygonTools = new draw(viewerRef.current.cesiumElement)
    // editPolygonTools = new draw2(viewerRef.current.cesiumElement)
    // editPolygonTools = draw2(viewerRef.current.cesiumElement,'point')

    polygon_height = viewerRef.current.cesiumElement.entities.add({
      name: 'polygon_height',
      polygon: {
        show: true,
        hierarchy: Cesium.Cartesian3.fromDegreesArray([110.0, 30.0, 120.0, 30.0, 115.0, 40.0]),
        height: 0,
        material: Cesium.Color.CYAN.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.BLACK,
      },
    })
  }, [])

  function handleClick(e, a, c) {
    viewerRef.current.cesiumElement.camera.flyTo({
      destination: a.id.polygon,
      duration: 2,
    })
  }

  function handlePolygon() {
    // editPolygonTools.startEditEntity(polygon_height)
    // clickDawPolygon(viewerRef.current.cesiumElement)
    // editPolygonTools.startDrawing()
    // editPolygonTools.startDraw({ type: 'area', radius: 5 })
    // draw3(viewerRef.current.cesiumElement,'rectangle')
  }
  return (
    <>
      <Viewer
        full
        ref={viewerRef}
        creditViewport={null}
        // orderIndependentTranslucency={false}
        homeButton={false} // 首页按钮
        // projectionPicker={false}
        timeline={false} // 时间线
        fullscreenButton={false} //全屏按钮
        vrButton={false} // vr模式
        navigationHelpButton={false} // 导航帮助按钮
        infoBox={false} // 点击弹出信息框
        selectionIndicator={false} // 是否显示选取指示器组件，绿色选中框
        navigationInstructionsInitiallyVisible={false}
        // scene3DOnly={false}
        // blurActiveElementOnCanvasFocus={false}
        // automaticallyTrackDataSourceClocks={false}
        animation={false} //动画器件
        // baseLayerPicker={false}
        geocoder={false} // 搜索框
        terrainProvider={Cesium.createWorldTerrain()} //地形服务
      >
        {/* <Entity>
          <GeoJsonDataSource
            ref={geoJsonDataRef}
            data={'china.json'}
            // onClick={handleClick}
            // stroke={Cesium.Color.fromCssColorString('#0d8dd1')}
            // fill={Cesium.Color.fromCssColorString('#03040e')}
            strokeWidth={3}
          />
        </Entity> */}
      </Viewer>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '10px',
          color: '#fff',
        }}
      >
        <span style={{ cursor: 'pointer', '&:hover': { color: '#666' } }} onClick={handlePolygon}>
          多边形
        </span>
      </div>
    </>
  )
}
