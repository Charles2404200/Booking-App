export const renderActivePage = (req,res)=>{
    const token = req.params.token;
    res.render('layouts/user', {
     
        body: 'pages/active',
        token: token,
      });
}