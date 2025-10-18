const TestRoute = () => {
  return (
    <div style={{
      background: 'red',
      color: 'white', 
      padding: '50px',
      fontSize: '48px',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      🔥 TEST ROUTE - If you see this RED PAGE, routing works!
      <br/><br/>
      Current URL: {window.location.pathname}
      <br/><br/>
      Time: {new Date().toLocaleString()}
    </div>
  );
};

export default TestRoute;