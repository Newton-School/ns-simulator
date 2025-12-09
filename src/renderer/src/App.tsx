function App(): React.JSX.Element {
  const ipcHandle = (): void => window.nssimulator.saveScenario("test ns simulator ipc bridge")

  return (
    <>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
    </>
  )
}

export default App
