import { Slider as ASlider } from "antd";


const Slider = (props) => {
  return (
    <ASlider
      {...props} 
      style={{ width: '100%', ...props.style }}
      handleStyle={{ backgroundColor: '#13161A' }}
    />
  )
}

export default Slider;