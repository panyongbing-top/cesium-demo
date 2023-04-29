import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import * as echarts from 'echarts'

const Echart = ({ options, styleName }: any) => {
  // const { options, class } = props
  const style = styleName || { width: '100%', height: '100%' }
  const chartRef: any = useRef<HTMLDivElement>(null)
  const [myChart, setMyChart] = useState<any>(null)

  const resizeEcharts = () => {
    myChart.resize()
  }

  // 初始化加载
  useEffect(() => {
    setMyChart(echarts.init(chartRef.current))
  }, [])

  // 改变时修改
  useEffect(() => {
    if (myChart) {
      window.addEventListener('resize', resizeEcharts)
      return () => {
        window.removeEventListener('resize', resizeEcharts)
        myChart.dispose()
        setMyChart(null)
      }
    }
  }, [myChart])

  //
  useEffect(() => {
    myChart && myChart.setOption(options)
  }, [myChart, options])

  return <Box ref={chartRef} style={style} />
}

export default Echart
