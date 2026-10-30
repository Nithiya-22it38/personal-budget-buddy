function ProgressBar({ percent, status }) {
  let width = percent
  if (width > 100) {
    width = 100
  }

  return (
    <div className="progress">
      <div
        className={'progress-fill ' + status}
        style={{ width: width + '%' }}
      ></div>
    </div>
  )
}

export default ProgressBar