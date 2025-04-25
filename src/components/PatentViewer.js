import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  font-family: Arial, sans-serif;
  padding: 20px;
  background-color: #f5f5f5;
  height: 100%;
  overflow-y: auto;
`;

const Title = styled.h1`
  color: #1a73e8;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  color: #202124;
`;

const PatentViewer = ({ patentNumber }) => {
  const [patentData, setPatentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatentData = async () => {
      try {
        // Mock data since BigQueryPatentFetcher is not provided
        const response = {
          data: {
            title: `Patent ${patentNumber}`,
            abstract: 'This is a mock abstract.',
            publication_number: patentNumber,
            filing_date: '2020-01-01',
            grant_date: '2022-01-01',
            inventor_harmonized: ['Inventor 1', 'Inventor 2'],
            assignee_harmonized: ['Assignee 1'],
            cpc_code: ['CPC1', 'CPC2'],
          },
        };
        setPatentData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching patent data');
        setLoading(false);
      }
    };

    if (patentNumber) fetchPatentData();
  }, [patentNumber]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!patentData) return <div>No patent data found</div>;

  return (
    <Container>
      <Title>{patentData.title}</Title>
      <Section>
        <SectionTitle>Abstract</SectionTitle>
        <p>{patentData.abstract}</p>
      </Section>
      <Section>
        <SectionTitle>Details</SectionTitle>
        <p>Publication Number: {patentData.publication_number}</p>
        <p>Filing Date: {patentData.filing_date}</p>
        <p>Grant Date: {patentData.grant_date}</p>
      </Section>
      <Section>
        <SectionTitle>Inventors</SectionTitle>
        <ul>
          {patentData.inventor_harmonized.map((inventor, index) => (
            <li key={index}>{inventor}</li>
          ))}
        </ul>
      </Section>
      <Section>
        <SectionTitle>Assignees</SectionTitle>
        <ul>
          {patentData.assignee_harmonized.map((assignee, index) => (
            <li key={index}>{assignee}</li>
          ))}
        </ul>
      </Section>
      <Section>
        <SectionTitle>CPC Codes</SectionTitle>
        <ul>
          {patentData.cpc_code.map((code, index) => (
            <li key={index}>{code}</li>
          ))}
        </ul>
      </Section>
    </Container>
  );
};

export default PatentViewer;