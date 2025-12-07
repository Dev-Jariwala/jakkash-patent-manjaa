import React from 'react'
import { Link } from 'react-router-dom'
import { ReactComponent as UnauthorizeSVG } from '../../assets/SVGS/status/401-unauthorized.svg'

const Unauthorize = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-12">
      <div className="flex flex-col items-center justify-center space-y-4">
        <UnauthorizeSVG className="w-60 h-w-60" />
        <h1 className="text-2xl font-bold text-center">401 Unauthorized</h1>
        <p className="text-center">You are not authorized to access this page.</p>
        <Link to="/" className="text-blue-500 hover:text-blue-600 text-sm font-semibold underline">Go back to home</Link>
      </div>
    </div>
  )
}

export default Unauthorize 