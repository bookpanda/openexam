package repository

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	"storage/internal/config"
	"storage/internal/domain"
)

type DynamoDBRepository struct {
	client           *dynamodb.Client
	slidesTable      string
	cheatsheetsTable string
	sharesTable      string
}

func NewDynamoDBRepository(client *dynamodb.Client, config *config.DynamoDBConfig) *DynamoDBRepository {
	return &DynamoDBRepository{
		client:           client,
		slidesTable:      config.SlidesTable,
		cheatsheetsTable: config.CheatsheetsTable,
		sharesTable:      config.SharesTable,
	}
}

// func (r *DynamoDBRepository) SaveCheatsheet(ctx context.Context, c domain.Cheatsheet) error {
// 	item, err := attributevalue.MarshalMap(c)
// 	if err != nil {
// 		return err
// 	}
// 	_, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
// 		TableName: &r.cheatsheetsTable,
// 		Item:      item,
// 	})
// 	return err
// }

// func (r *DynamoDBRepository) DeleteCheatsheet(ctx context.Context, id string) error {
// 	_, err := r.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
// 		TableName: &r.cheatsheetsTable,
// 		Key: map[string]types.AttributeValue{
// 			"id": &types.AttributeValueMemberS{Value: id},
// 		},
// 	})
// 	return err
// }

func (r *DynamoDBRepository) ShareCheatsheet(ctx context.Context, userId, cheatsheetId string) error {
	_, err := r.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &r.sharesTable,
		Item: map[string]types.AttributeValue{
			"userId":       &types.AttributeValueMemberS{Value: userId},
			"cheatsheetId": &types.AttributeValueMemberS{Value: cheatsheetId},
		},
	})
	return err
}

func (r *DynamoDBRepository) UnshareCheatsheet(ctx context.Context, userId, cheatsheetId string) error {
	_, err := r.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: &r.sharesTable,
		Key: map[string]types.AttributeValue{
			"userId":       &types.AttributeValueMemberS{Value: userId},
			"cheatsheetId": &types.AttributeValueMemberS{Value: cheatsheetId},
		},
	})
	return err
}

// func (r *DynamoDBRepository) DeleteCheatsheetByKey(ctx context.Context, key string) error {
// 	out, err := r.client.Query(ctx, &dynamodb.QueryInput{
// 		TableName:              &r.cheatsheetsTable,
// 		IndexName:              aws.String("key-index"),
// 		KeyConditionExpression: aws.String("#k = :v"),
// 		ExpressionAttributeNames: map[string]string{
// 			"#k": "key",
// 		},
// 		ExpressionAttributeValues: map[string]types.AttributeValue{
// 			":v": &types.AttributeValueMemberS{Value: key},
// 		},
// 	})
// 	if err != nil {
// 		return err
// 	}
// 	if len(out.Items) == 0 {
// 		return nil
// 	}

// 	var c domain.Cheatsheet
// 	if err := attributevalue.UnmarshalMap(out.Items[0], &c); err != nil {
// 		return err
// 	}

// 	_, err = r.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
// 		TableName: &r.cheatsheetsTable,
// 		Key: map[string]types.AttributeValue{
// 			"id": &types.AttributeValueMemberS{Value: c.ID},
// 		},
// 	})
// 	return err
// }

func (r *DynamoDBRepository) DeleteSharesByKey(ctx context.Context, key string) error {
	out, err := r.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &r.cheatsheetsTable,
		IndexName:              aws.String("KeyIndex"),
		KeyConditionExpression: aws.String("#k = :v"),
		ExpressionAttributeNames: map[string]string{
			"#k": "key",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":v": &types.AttributeValueMemberS{Value: key},
		},
	})
	if err != nil {
		return err
	}
	if len(out.Items) == 0 {
		return nil
	}

	var c domain.Cheatsheet
	if err := attributevalue.UnmarshalMap(out.Items[0], &c); err != nil {
		return err
	}

	// list shares, userId+cheatsheetId
	outShares, err := r.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &r.sharesTable,
		IndexName:              aws.String("CheatsheetIdIndex"), // GSI
		KeyConditionExpression: aws.String("cheatsheetId = :cid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":cid": &types.AttributeValueMemberS{Value: c.ID},
		},
	})
	if err != nil {
		return err
	}

	for _, item := range outShares.Items {
		var s domain.Share
		if err := attributevalue.UnmarshalMap(item, &s); err != nil {
			return err
		}
		_, err = r.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
			TableName: &r.sharesTable,
			Key: map[string]types.AttributeValue{
				"userId":       &types.AttributeValueMemberS{Value: s.UserID},
				"cheatsheetId": &types.AttributeValueMemberS{Value: s.CheatsheetID},
			},
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *DynamoDBRepository) FindCheatsheetByKey(ctx context.Context, key string) (domain.Cheatsheet, error) {
	out, err := r.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &r.cheatsheetsTable,
		IndexName:              aws.String("KeyIndex"),
		KeyConditionExpression: aws.String("#k = :v"),
		ExpressionAttributeNames: map[string]string{
			"#k": "key",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":v": &types.AttributeValueMemberS{Value: key},
		},
	})
	if err != nil {
		return domain.Cheatsheet{}, err
	}
	if len(out.Items) == 0 {
		return domain.Cheatsheet{}, domain.ErrNotFound
	}

	var c domain.Cheatsheet
	if err := attributevalue.UnmarshalMap(out.Items[0], &c); err != nil {
		return domain.Cheatsheet{}, err
	}
	return c, nil
}

func (r *DynamoDBRepository) DeleteSharesByCheatsheetID(ctx context.Context, cheatsheetId string) error {
	out, err := r.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &r.sharesTable,
		IndexName:              aws.String("CheatsheetIdIndex"),
		KeyConditionExpression: aws.String("cheatsheetId = :cid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":cid": &types.AttributeValueMemberS{Value: cheatsheetId},
		},
	})
	if err != nil {
		return err
	}

	for _, item := range out.Items {
		var s domain.Share
		if err := attributevalue.UnmarshalMap(item, &s); err != nil {
			return err
		}
		_, err = r.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
			TableName: &r.sharesTable,
			Key: map[string]types.AttributeValue{
				"userId":       &types.AttributeValueMemberS{Value: s.UserID},
				"cheatsheetId": &types.AttributeValueMemberS{Value: s.CheatsheetID},
			},
		})
		if err != nil {
			return err
		}
	}
	return nil
}
