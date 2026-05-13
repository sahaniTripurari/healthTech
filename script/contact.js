

/* FORM */
document.addEventListener("DOMContentLoaded",function(){

  const form = document.getElementById("contactForm");

  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      const status=document.getElementById("formStatus");
      status.style.color="#00d4ff";
      status.innerText="Message sent successfully!";
      this.reset();
    });
  }

});
