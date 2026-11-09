'use client'

import { Button as AntButton, type ButtonProps } from 'antd'
import type { FC } from 'react'

// The single seam for AntD's Button: one place to change when a product-wide default appears.
const Button: FC<ButtonProps> = (props) => <AntButton {...props} />

export default Button
