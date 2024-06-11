document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // When submiting the form it runs the send_email function
  document.querySelector("#compose-form").addEventListener('submit', function(event) {
    event.preventDefault(); 
    send_mail();
  });  

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function send_mail() {

  // Get the values from each field when composing email
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Post request to the API for sending an email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result);
      load_mailbox('sent')
  })
  .catch(error => {
    console.log(error)
  });
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Create a div container for all emails
  const emailItems = document.createElement('div')
  document.querySelector('#emails-view').appendChild(emailItems);

  // Fetch and create each email with sender, subject, and timestamp
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      // Create a div for each email
      const div = document.createElement('div');

      // Container div
      if (email.read && mailbox != "sent"){
        div.style.backgroundColor = "lightGrey"
      }
      div.id = `${email.id}`;
      div.style.display = "flex";
      div.style.justifyContent = "space-between"
      div.style.borderTop = "black solid 1px"
      div.style.padding = "6px 6px"
      div.style.fontWeight = "Bold"
      div.style.cursor = "Pointer"

      // Sender div
      const sender = document.createElement('div');
      if (mailbox == "sent"){
        sender.textContent = "To: " + email.recipients;
      }
      else{
        sender.textContent = email.sender;
      }
      sender.style.flex = "1";
      sender.style.marginRight = "20px";

      // Subject div
      const subject = document.createElement('div');
      subject.textContent = email.subject;
      subject.style.flex = "3";
      subject.style.textAlign = "left";

      // Time div
      const time = document.createElement('div');
      time.textContent = email.timestamp;
      time.style.flex = "1";
      time.style.textAlign = "right";

      // Append all divs
      div.appendChild(sender)
      div.appendChild(subject)
      div.appendChild(time)
      emailItems.appendChild(div);

      // Event listener that gets the email id when clicked on div
      div.addEventListener('click', () => load_email(mailbox, email.id));
    })
    .catch(error => {
      console.log(error)
    });;
});
}


function load_email(mailbox, email_id){

  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  
  // If sent mailbox page, don't display the archive/unarchive buttons
  const archiveButton = document.querySelector('#archive');
  const unarchiveButton = document.querySelector('#unarchive');

  if (mailbox === "sent") {
    archiveButton.style.display = 'none';
    unarchiveButton.style.display = 'none';
  } else {
    if (mailbox === "inbox") {
      archiveButton.style.display = 'inline-block';
      unarchiveButton.style.display = 'none';
    } else {
      archiveButton.style.display = 'none';
      unarchiveButton.style.display = 'inline-block';
    }
  }

  // Remove existing event listeners
  const newArchiveButton = archiveButton.cloneNode(true);
  archiveButton.replaceWith(newArchiveButton);

  const newUnarchiveButton = unarchiveButton.cloneNode(true);
  unarchiveButton.replaceWith(newUnarchiveButton);

  // Add event listeners for the buttons
  if (mailbox === "inbox") {
    newArchiveButton.addEventListener('click', () => archive(email_id));
  } else {
    newUnarchiveButton.addEventListener('click', () => unarchive(email_id));
  }

  // Fetch the email with GET request
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email =>{
    document.querySelector('#sender').innerHTML = "<strong>From:</strong> " + email.sender;
    document.querySelector('#recipients').innerHTML = "<strong>To:</strong> " + email.recipients.join(', ');
    document.querySelector('#subject').innerHTML = "<strong>Subject:</strong> " + email.subject;
    document.querySelector('#timestamp').innerHTML = "<strong>Timestamp:</strong> " + email.timestamp;
    document.querySelector('#body').innerHTML = email.body.replace(/\n/g, '<br>');
  })
  .catch(error => {
    console.log(error)
  });;

  // Fetch the email with PUT to update read attribute to true
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  .catch(error => {
    console.log(error)
  });

  // Listener for the reply button
  document.querySelector("#reply").addEventListener('click', () => reply(email_id))

}

// Function to archive mail
function archive(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  }) 
  .then(() => {
    load_mailbox('inbox');
  })
  .catch(error => {
    console.log(error)
  });
}

// function to unarchive mail
function unarchive(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  }) 
  .then(() => {
    load_mailbox('inbox');
  })
  .catch(error => {
    console.log(error)
  });
}

function reply(email_id){
  // Load the compose email page
  compose_email()
  
  // Fetch the email content with GET request to prepopulate
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email =>{
    document.querySelector('#compose-recipients').value = email.sender;
    if (!email.subject.startsWith("Re:")){
      document.querySelector('#compose-subject').value = "Re:" + email.subject;
    }else{
      document.querySelector('#compose-subject').value = email.subject;
    }

    composeBody = document.querySelector('#compose-body')
    composeBody.value = "On " + email.timestamp + " " + email.sender + " wrote: \n\n" + email.body + "\n\n";
    composeBody.focus();


  })
  .catch(error => {
    console.log(error)
  });;
}
