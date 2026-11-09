'use client'

import { Modal as AntModal, type ModalProps } from 'antd'
import type { FC } from 'react'

// Unmount content on close so forms inside always reopen clean.
const Modal: FC<ModalProps> = (props) => <AntModal destroyOnHidden centered {...props} />

export default Modal
