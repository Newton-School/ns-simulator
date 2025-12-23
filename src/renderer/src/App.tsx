function App(): React.JSX.Element {
  const ipcHandle = (): void => window.nssimulator.saveScenario("test ns simulator ipc bridge")

  return (
    <>
        <div className="action">
           <button type="button" onClick={ipcHandle}>
            Send IPC
          </button>
        </div>
    </>
  )
}

export default App
