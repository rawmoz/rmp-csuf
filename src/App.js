import React, { useState } from 'react';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const searchProfessors = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // Check if search query is a number (professor ID)
      const isId = /^\d+$/.test(searchQuery.trim());
      
      let query;
      let variables;

      if (isId) {
        // Search by professor ID
        query = `
          query TeacherByIdQuery($id: ID!) {
            node(id: $id) {
              ... on Teacher {
                id
                legacyId
                firstName
                lastName
                department
                school {
                  name
                }
                avgRating
                avgDifficulty
                wouldTakeAgainPercent
                numRatings
                ratings(first: 5) {
                  edges {
                    node {
                      class
                      comment
                      wouldTakeAgain
                      difficultyRating
                      helpfulRating
                      clarityRating
                      date
                    }
                  }
                }
              }
            }
          }
        `;
        // Convert legacyId to base64 encoded ID
        const encodedId = btoa(`Teacher-${searchQuery}`);
        variables = { id: encodedId };
      } else {
        // Search by name
        query = `
          query NewSearchTeachersQuery($text: String!) {
            newSearch {
              teachers(query: {text: $text, schoolID: "U2Nob29sLTEwNzQ="}) {
                edges {
                  node {
                    id
                    legacyId
                    firstName
                    lastName
                    department
                    avgRating
                    avgDifficulty
                    wouldTakeAgainPercent
                    numRatings
                    ratings(first: 5) {
                      edges {
                        node {
                          class
                          comment
                          wouldTakeAgain
                          difficultyRating
                          helpfulRating
                          clarityRating
                          date
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;
        variables = { text: searchQuery };
      }

      const response = await fetch('https://www.ratemyprofessors.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic dGVzdDp0ZXN0'
        },
        body: JSON.stringify({
          query: query,
          variables: variables
        })
      });

      const data = await response.json();
      
      console.log('Search Query:', searchQuery);
      console.log('Full API Response:', JSON.stringify(data, null, 2));

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      let professorsList = [];

      if (isId) {
        // Handle single professor from ID search
        const teacher = data.data?.node;
        if (teacher && teacher.firstName) {
          professorsList = [{
            id: teacher.id,
            legacyId: teacher.legacyId,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            department: teacher.department,
            avgRating: teacher.avgRating,
            avgDifficulty: teacher.avgDifficulty,
            wouldTakeAgainPercent: teacher.wouldTakeAgainPercent,
            numRatings: teacher.numRatings,
            ratings: teacher.ratings
          }];
        }
      } else {
        // Handle multiple professors from name search
        const teachers = data.data?.newSearch?.teachers?.edges || [];
        professorsList = teachers.map(edge => ({
          id: edge.node.id,
          legacyId: edge.node.legacyId,
          firstName: edge.node.firstName,
          lastName: edge.node.lastName,
          department: edge.node.department,
          avgRating: edge.node.avgRating,
          avgDifficulty: edge.node.avgDifficulty,
          wouldTakeAgainPercent: edge.node.wouldTakeAgainPercent,
          numRatings: edge.node.numRatings,
          ratings: edge.node.ratings
        }));
      }

      console.log('Number of results:', professorsList.length);
      setProfessors(professorsList);
    } catch (err) {
      setError(err.message || 'Failed to fetch professor data');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchProfessors();
    }
  };

  const getRatingColor = (rating) => {
    if (!rating || rating === 0) return '#999';
    if (rating >= 4.0) return '#4caf50';
    if (rating >= 3.0) return '#ff9800';
    return '#f44336';
  };

  const getDifficultyColor = (difficulty) => {
    if (!difficulty || difficulty === 0) return '#999';
    if (difficulty >= 4.0) return '#f44336';
    if (difficulty >= 3.0) return '#ff9800';
    return '#4caf50';
  };

  return (
    <div className="App">
      <div className="header">
        <h1>🎓 CSUF Professor Finder</h1>
        <p className="subtitle">Search Rate My Professor reviews for Cal State Fullerton</p>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a professor (e.g., Smith, John)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="search-button" onClick={searchProfessors} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Searching for professors...</p>
        </div>
      )}

      {!loading && searched && professors.length === 0 && !error && (
        <div className="no-results">
          No professors found. Try a different search term.
        </div>
      )}

      <div className="professors-grid">
        {professors.map((prof) => (
          <div key={prof.id} className="professor-card">
            <div className="professor-header">
              <h2 className="professor-name">
                {prof.firstName} {prof.lastName}
              </h2>
              <span className="department">{prof.department || 'N/A'}</span>
            </div>

            <div className="ratings-overview">
              <div className="rating-box">
                <div 
                  className="rating-value" 
                  style={{ backgroundColor: getRatingColor(prof.avgRating) }}
                >
                  {prof.avgRating ? prof.avgRating.toFixed(1) : 'N/A'}
                </div>
                <div className="rating-label">Overall Rating</div>
              </div>

              <div className="rating-box">
                <div 
                  className="rating-value"
                  style={{ backgroundColor: getDifficultyColor(prof.avgDifficulty) }}
                >
                  {prof.avgDifficulty ? prof.avgDifficulty.toFixed(1) : 'N/A'}
                </div>
                <div className="rating-label">Difficulty</div>
              </div>

              <div className="rating-box">
                <div className="rating-value secondary">
                  {prof.wouldTakeAgainPercent !== -1 && prof.wouldTakeAgainPercent !== null
                    ? `${prof.wouldTakeAgainPercent}%`
                    : 'N/A'}
                </div>
                <div className="rating-label">Would Take Again</div>
              </div>
            </div>

            <div className="ratings-count">
              {prof.numRatings} rating{prof.numRatings !== 1 ? 's' : ''}
            </div>

            {prof.ratings?.edges && prof.ratings.edges.length > 0 && (
              <div className="reviews-section">
                <h3>Recent Reviews</h3>
                <div className="reviews-list">
                  {prof.ratings.edges.map((ratingEdge, index) => {
                    const rating = ratingEdge.node;
                    return (
                      <div key={index} className="review-card">
                        {rating.class && (
                          <div className="review-class">{rating.class}</div>
                        )}
                        {rating.comment && (
                          <p className="review-comment">{rating.comment}</p>
                        )}
                        <div className="review-meta">
                          {rating.wouldTakeAgain !== null && (
                            <span className={`tag ${rating.wouldTakeAgain ? 'positive' : 'negative'}`}>
                              {rating.wouldTakeAgain ? '👍 Would take again' : '👎 Would not take again'}
                            </span>
                          )}
                          {rating.date && (
                            <span className="review-date">{rating.date}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
