'use client'

import { Input as AntInput, type InputProps } from 'antd'

const InputRoot = (props: InputProps) => <AntInput {...props} />

// Statics are re-exported so callers never need the raw antd import.
const Input = Object.assign(InputRoot, {
  Password: AntInput.Password,
  TextArea: AntInput.TextArea,
  Search: AntInput.Search,
})

export default Input
