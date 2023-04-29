import { Button } from '@mui/material'
import { styled } from '@mui/material/styles'

const MyButton = styled(Button)({
  boxShadow: '0px 0px 4px 0px rgba(43,48,63,0.5000)',
  borderRadius: '4px',
  border: '1px solid #ffffff99',
  fontSize: '14px',
  fontWeight: 400,
  color: '#fff',
  opacity: 0.6,
  padding: '8px',
  height: '30px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  '&:hover': {
    background: 'linear-gradient(180deg, #AEBDD8 0%, #7E98C8 85%, #8499BF 100%)',
    boxShadow: '0px 0px 8px 0px rgba(26,28,37,0.5000)',
    borderColor: 'transparent',
    opacity: 1,
  },
  '&:active': {
    background: '#616C8C',
    boxShadow: '0px 0px 8px 0px rgba(26,28,37,0.5000)',
    opacity: 0.6,
  },
})

export default MyButton
