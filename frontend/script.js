// Function to handle form submission inx index.html
async function submitForm(event) {
    event.preventDefault();

    const formData = new FormData(document.querySelector('form'));
    const data = Object.fromEntries(formData.entries());

    try {
        // Check if mobile number already exists
        const mobileCheckResponse = await fetch(`http://localhost:8080/checkMobile?mobile=${data.mobile}`);

        if (!mobileCheckResponse.ok) {
            const errorResult = await mobileCheckResponse.json();
            throw new Error(errorResult.message || 'Mobile number check failed');
        }

        const mobileCheckResult = await mobileCheckResponse.json();

        if (mobileCheckResult.exists) {
            alert("User already exists with that mobile number."); // Display alert dialog
            console.error('Mobile number already exists');
            return; // Prevent form submission
        }

        const response = await fetch('http://localhost:8080/submit', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Submission failed');
        }

        const result = await response.json();
        alert(result.message);

        // Clear the form fields after successful submission
        document.querySelector('form').reset();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// Function to open search.html in a new window
function openSearchPage() {
    const newWindow = window.open('search.html', '_blank');
    if (!newWindow) {
        alert("Please allow pop-ups for this site to search users.");
    }
}


// Function to handle user search in search.html
async function searchUser(event) {
    event.preventDefault();

    const searchValue = document.getElementById('search').value;

    try {
        const response = await fetch(`http://localhost:8080/search?query=${searchValue}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'User not found');
        }

        const result = await response.json();
        displayUserDetails(result);

        // Optional: clear the search field after successful search
        document.getElementById('search').value = '';
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('user-details').innerHTML = `<p>${error.message}</p>`;
    }
}

function displayUserDetails(user) {
    const userDetailsDiv = document.getElementById('user-details');
    userDetailsDiv.innerHTML = `
        <p>Name: ${user.name}</p>
        <p>Age: ${user.age}</p>
        <p>Mobile: ${user.mobile}</p>
        <p>Nationality: ${user.nationality}</p>
        <p>Language: ${user.language}</p>
        <p>Amount: ${user.amount}</p>
    `;
}

// Function to open allUsers.html in a new window
function displayAllUsers() {
    const newWindow = window.open('allUsers.html', '_blank');
    if (!newWindow) {
        alert("Please allow pop-ups for this site to view all users.");
    }
}

// Function to fetch and display users (for allUsers.html)
async function fetchAndDisplayUsers() {
    try {
        const response = await fetch('http://localhost:8080/allUsers');
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const users = await response.json();
        const tableBody = document.getElementById('usersTableBody');

        users.forEach(user => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = user.name;
            row.insertCell().textContent = user.age;
            row.insertCell().textContent = user.mobile;
            row.insertCell().textContent = user.nationality;
            row.insertCell().textContent = user.language;
            row.insertCell().textContent = user.amount;
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        alert('Error fetching user data.');
    }
}

// Check if the current page is allUsers.html
if (window.location.pathname.endsWith('allUsers.html')) {
    fetchAndDisplayUsers();
}
