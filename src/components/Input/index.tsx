import React from 'react'
import { TextField } from '@mui/material'
import { styled } from '@mui/material/styles'

const Input = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    fontSize: '12px',
    fontWeight: 300,
    color: '#FFFFFF',
    width: '100%',
    height: '26px',
    '& fieldset': {
      border: 'none',
      background: '#232734',
      borderRadius: '2px',
      opacity: '0.6',
    },
  },
  '& .MuiPopover-root': {
    '& .MuiPaper-root': {
      background: '#353B4D',
      '& .MuiMenu-list': {
        height: '200px !important',
      },
    },
  },
})

export default Input
