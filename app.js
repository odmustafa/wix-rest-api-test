// Function to format birthdate in a user-friendly way (e.g., "May 18, 1991")
function formatBirthdate(dateString) {
    try {
        if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) {
            return dateString;
        }

        console.log('Formatting birthdate:', dateString);

        // Parse the date string (format: YYYY-MM-DD)
        const parts = dateString.split('-');
        if (parts.length !== 3) {
            return dateString;
        }

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
        const day = parseInt(parts[2], 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return dateString;
        }

        console.log('Parsed date parts:', { year, month: month + 1, day });

        // Create a date object using UTC to avoid timezone issues
        const date = new Date(Date.UTC(year, month, day));
        console.log('Created date object:', date.toISOString());

        // Format the date using options
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        const formatted = date.toLocaleDateString(undefined, options);
        console.log('Formatted date:', formatted);

        return formatted;
    } catch (error) {
        console.error('Error formatting birthdate:', error);
        return dateString; // Return tto mahe original string if there's an error
    }
}

// Test the formatBirthdate function
console.log('Testing formatBirthdate function:');
console.log('1991-05-18 ->', formatBirthdate('1991-05-18'));
console.log('1985-12-25 ->', formatBirthdate('1985-12-25'));
console.log('2000-01-01 ->', formatBirthdate('2000-01-01'));

document.addEventListener('DOMContentLoaded', function () {
    // Get references to DOM elements
    const searchForm = document.getElementById('searchForm');
    const nameSearchInput = document.getElementById('nameSearch');
    const resultsContainer = document.getElementById('results');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');

    // Handle form submission
    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const searchName = nameSearchInput.value.trim();
        if (!searchName) return;

        searchContacts(searchName);
    });

    // Function to search contacts
    function searchContacts(name) {
        // Show loading indicator
        loadingElement.style.display = 'block';
        // Clear previous results and errors
        resultsContainer.innerHTML = '';
        errorElement.style.display = 'none';

        // Prepare the query
        const queryData = {
            query: {
                filter: {
                    $or: [
                        { "info.name.first": { $startsWith: name } },
                        { "info.name.last": { $startsWith: name } }
                    ]
                },
                paging: {
                    limit: 10
                },
                fieldsets: ["FULL"]
            }
        };

        // Make the API request through our proxy server
        fetch('/api/contacts/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(queryData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('API request failed with status ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                // Hide loading indicator
                loadingElement.style.display = 'none';

                // Display results
                displayResults(data.contacts || []);
            })
            .catch(error => {
                // Hide loading indicator
                loadingElement.style.display = 'none';

                // Log detailed error information
                console.error('Fetch error details:', error);

                // Show error message
                showError('Error searching contacts: ' + error.message);
            });
    }

    // Function to display search results
    function displayResults(contacts) {
        if (contacts.length === 0) {
            resultsContainer.innerHTML = '<p>No contacts found matching your search.</p>';
            return;
        }

        // First, create all contact cards with placeholders for subscriptions
        let html = '';
        contacts.forEach(contact => {
            const firstName = contact.info?.name?.first || '';
            const lastName = contact.info?.name?.last || '';
            const email = contact.primaryInfo?.email || '';
            const phone = contact.primaryInfo?.phone || '';
            const company = contact.info?.company || '';
            const jobTitle = contact.info?.jobTitle || '';
            const contactId = contact.id;
            const memberId = contact.memberInfo?.memberId || '';
            const birthdate = contact.info?.birthdate || '';

            // Calculate age if birthdate is available
            let age = '';
            try {
                if (birthdate) {
                    console.log('Processing birthdate for contact:', contact.id, birthdate);

                    // Parse the birthdate string directly (format: YYYY-MM-DD)
                    const [birthYear, birthMonth, birthDay] = birthdate.split('-').map(Number);
                    console.log('Parsed birth date parts:', { birthYear, birthMonth, birthDay });

                    const today = new Date();
                    const currentYear = today.getFullYear();
                    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
                    const currentDay = today.getDate();
                    console.log('Current date parts:', { currentYear, currentMonth, currentDay });

                    // Calculate age
                    age = currentYear - birthYear;

                    // Adjust age if birthday hasn't occurred yet this year
                    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
                        age--;
                    }

                    console.log('Calculated age:', age);
                }
            } catch (error) {
                console.error('Error calculating age:', error);
                age = '';
            }

            // Check if contact is under 21
            const isUnder21 = age && parseInt(age, 10) < 21;

            html += `
                <div class="contact-card ${isUnder21 ? 'under-21' : ''}" id="contact-${contactId}">
                    <h3>${firstName} ${lastName}${isUnder21 ? ' <span class="age-warning-small">⚠️ UNDER 21</span>' : ''}</h3>
                    <p><strong>Contact ID:</strong> ${contactId}</p>
                    ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
                    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                    ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
                    ${jobTitle ? `<p><strong>Job Title:</strong> ${jobTitle}</p>` : ''}
                    ${(() => {
                    try {
                        return birthdate ? `<p><strong>Birthday:</strong> ${formatBirthdate(birthdate)}</p>` : '';
                    } catch (error) {
                        console.error('Error displaying birthdate:', error);
                        return birthdate ? `<p><strong>Birthday:</strong> ${birthdate}</p>` : '';
                    }
                })()}
                    ${(() => {
                    if (age) {
                        const ageNum = parseInt(age, 10);
                        if (!isNaN(ageNum) && ageNum < 21) {
                            return `<p><strong>Age:</strong> ${age} <span class="age-warning">⚠️ WARNING: UNDER 21</span></p>`;
                        } else {
                            return `<p><strong>Age:</strong> ${age}</p>`;
                        }
                    }
                    return '';
                })()}
                    ${memberId ? `<p><strong>Member ID:</strong> ${memberId}</p>` : ''}
                    ${memberId ? `<div class="subscriptions" id="subscriptions-${contactId}"><p>Loading subscriptions...</p></div>` : ''}
                </div>
            `;
        });

        // Update the results container with all contact cards
        resultsContainer.innerHTML = html;

        // Then, fetch subscription information for each member
        const fetchSubscriptions = async () => {
            for (const contact of contacts) {
                const contactId = contact.id;
                const memberId = contact.memberInfo?.memberId || '';

                if (memberId) {
                    const subscriptionsContainer = document.getElementById(`subscriptions-${contactId}`);
                    if (!subscriptionsContainer) continue; // Skip if container not found

                    try {
                        const response = await fetch(`/api/orders/member/${memberId}`);
                        if (!response.ok) {
                            throw new Error('Failed to fetch subscription information');
                        }

                        const data = await response.json();

                        if (data.orders && data.orders.length > 0) {
                            let subscriptionsHtml = '<h4>Subscriptions</h4><ul>';

                            data.orders.forEach(order => {
                                const planName = order.planName || 'Unknown Plan';
                                const status = order.status || 'Unknown Status';
                                const startDate = order.startDate ? new Date(order.startDate).toLocaleDateString() : 'Unknown';
                                const endDate = order.endDate ? new Date(order.endDate).toLocaleDateString() : 'Ongoing';

                                subscriptionsHtml += `
                                    <li>
                                        <strong>Plan:</strong> ${planName}<br>
                                        <strong>Status:</strong> ${status}<br>
                                        <strong>Start Date:</strong> ${startDate}<br>
                                        <strong>End Date:</strong> ${endDate}
                                    </li>
                                `;
                            });

                            subscriptionsHtml += '</ul>';
                            subscriptionsContainer.innerHTML = subscriptionsHtml;
                        } else {
                            subscriptionsContainer.innerHTML = '<p>No subscriptions found</p>';
                        }
                    } catch (error) {
                        subscriptionsContainer.innerHTML = `<p>Error loading subscriptions: ${error.message}</p>`;
                    }
                }
            }
        };

        // Start fetching subscriptions
        fetchSubscriptions();
    }

    // Function to show error messages
    function showError(message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
});
